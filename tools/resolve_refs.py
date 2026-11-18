#!/usr/bin/env python3
"""題名と第一著者から書誌を引き、文献マスター表に統合できる CSV を作る。

    python3 tools/resolve_refs.py literature/incoming/<名前>_queries.tsv

入力（タブ区切り）: id, track, first_author, year, title
出力: literature/incoming/<名前>.csv（マスター表と同じ列）と、<名前>_unresolved.tsv（見つからなかった行）

エージェントが記憶で挙げた文献を、そのまま信じないための道具である。
Crossref（無ければ arXiv）で題名を検索し、題名の一致度 0.9 以上・第一著者の姓が一致・年の差3年以内の
ものだけを採用する。採用した行の read_depth は biblio（書誌だけ）で、要点は空にする。
外に送るのは題名と著者の姓だけである。
"""
import csv
import datetime
import html
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import litdb  # noqa: E402

UA = {"User-Agent": "resolve-refs/1.0 (bibliography tool)"}
TODAY = datetime.date.today().isoformat()


def fold(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", re.sub(r"<[^>]+>", "", s).lower()).strip()


def get(url):
    for wait in (0, 2, 6):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read().decode("utf-8", "ignore")
        except (urllib.error.URLError, TimeoutError):
            pass
    return None


def crossref(q):
    url = ("https://api.crossref.org/works?rows=8&select=DOI,title,author,issued,container-title,volume,issue,page,type"
           f"&query.bibliographic={urllib.parse.quote(q['title'])}&query.author={urllib.parse.quote(q['first_author'])}")
    raw = get(url)
    if raw is None:
        return None, "Crossref に接続できない"
    best = None
    for m in json.loads(raw)["message"]["items"]:
        title = (m.get("title") or [""])[0]
        sim = SequenceMatcher(None, fold(q["title"]), fold(title)).ratio()
        fams = [fold(a.get("family", "")) for a in m.get("author", [])]
        year = (m.get("issued", {}).get("date-parts") or [[None]])[0][0]
        if sim < 0.9 or not year or abs(year - int(q["year"])) > 3:
            continue
        if not any(fold(q["first_author"]) in f or f in fold(q["first_author"]) for f in fams if f):
            continue
        rank = (m.get("type") == "journal-article", sim, -abs(year - int(q["year"])))
        if best is None or rank > best[0]:
            best = (rank, m, title, year)
    if not best:
        return None, "Crossref に一致なし"
    _, m, title, year = best
    authors = [f"{a['family']}, {a.get('given', '')}".rstrip(", ") for a in m.get("author", []) if a.get("family")]
    authors = " and ".join(authors[:6]) + (" and others" if len(authors) > 6 else "")
    kind = "article" if m.get("type") in ("journal-article", "book-chapter", "proceedings-article") else "wp"
    row = dict(type=kind, title=html.unescape(re.sub(r"<[^>]+>", "", title)), authors=authors, year=str(year),
               venue=html.unescape((m.get("container-title") or [""])[0]), volume=m.get("volume", ""), number=m.get("issue", ""),
               pages=(m.get("page") or "").replace("-", "--"), doi=m["DOI"])
    if kind == "wp":
        row.update(url=f"https://doi.org/{m['DOI']}", urldate=TODAY)
    return row, ""


def arxiv(q):
    raw = get("http://export.arxiv.org/api/query?max_results=5&search_query=" + urllib.parse.quote(f'ti:"{q["title"]}"'))
    if raw is None:
        return None, "arXiv に接続できない"
    for entry in re.findall(r"<entry>(.*?)</entry>", raw, re.S):
        title = re.sub(r"\s+", " ", html.unescape(re.search(r"<title>(.*?)</title>", entry, re.S).group(1))).strip()
        if SequenceMatcher(None, fold(q["title"]), fold(title)).ratio() < 0.9:
            continue
        names = [html.unescape(n) for n in re.findall(r"<name>(.*?)</name>", entry)]
        if not any(fold(q["first_author"]) in fold(n) for n in names):
            continue
        url = re.search(r"<id>(.*?)</id>", entry).group(1).strip()
        url = re.sub(r"v\d+$", "", url).replace("http://", "https://")
        year = re.search(r"<published>(\d{4})", entry).group(1)
        authors = " and ".join(f"{n.rsplit(' ', 1)[-1]}, {n.rsplit(' ', 1)[0]}" if " " in n else n for n in names[:6])
        return dict(type="wp", title=title, authors=authors + (" and others" if len(names) > 6 else ""), year=year,
                    venue="arXiv:" + url.rsplit("/", 1)[-1], url=url, urldate=TODAY, fulltext_url=url), ""
    return None, "arXiv に一致なし"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    name = src.stem.replace("_queries", "")
    with open(src, newline="", encoding="utf-8") as f:
        queries = list(csv.DictReader(f, delimiter="\t"))
    have = {r["id"] for r in litdb.read()}
    rows, missing = [], []
    for q in queries:
        if q["id"] in have:
            print(f"  既にある  {q['id']}")
            continue
        row, why = crossref(q)
        if row is None:
            row, why2 = arxiv(q)
            why = f"{why}／{why2}"
        if row is None:
            missing.append({**q, "reason": why})
            print(f"  無し      {q['id']}: {why}")
            continue
        row.update(id=q["id"], track=q["track"], importance="3", read_depth="biblio", added=TODAY, added_by="AI",
                   note="題名検索で書誌を引いた。本文・要旨は未確認")
        rows.append(row)
        print(f"  {'DOI ' if row.get('doi') else 'arXiv'}     {q['id']}  {row.get('doi') or row['url']}")
    out = src.with_name(f"{name}.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=litdb.COLS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in litdb.COLS})
    with open(src.with_name(f"{name}_unresolved.tsv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "track", "first_author", "year", "title", "reason"], delimiter="\t")
        w.writeheader()
        w.writerows(missing)
    print(f"採用 {len(rows)} 件 → {out}。見つからず {len(missing)} 件。次に tools/litdb.py merge / verify / check。")


if __name__ == "__main__":
    main()
