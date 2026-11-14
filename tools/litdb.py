#!/usr/bin/env python3
"""文献マスター表（literature/papers.csv）の道具。書式と手順は literature/README.md。

    python3 tools/litdb.py check                 # 書式・重複・読んだ深さの約束を点検する
    python3 tools/litdb.py verify [--all]        # DOI を Crossref で照合し、doi_ok と doi_checked を書く
    python3 tools/litdb.py merge                 # literature/incoming/*.csv をマスター表に統合する
    python3 tools/litdb.py bib <dir> [...]       # <dir>/paper の \\cite からキーを集め、<dir>/common/refs.bib を作る
    python3 tools/litdb.py pdf [--all]           # 公開されている PDF の場所を探し、pdf_url に書く
    python3 tools/litdb.py stats                 # 件数の内訳を表示する

マスター表が唯一の正。refs.bib は生成物で、手で直さない。
"""
import csv
import datetime
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "literature/papers.csv"
INCOMING = ROOT / "literature/incoming"
COLS = ["id", "importance", "year", "track", "field", "tags", "type", "title", "authors", "venue", "volume", "number", "pages",
        "doi", "url", "urldate", "design", "data", "key_finding", "significance", "read_depth", "fulltext_url", "pdf_url",
        "themes", "projects", "added", "added_by", "doi_ok", "doi_checked", "checked_by_human", "note"]
TYPES = {"article", "wp", "online", "book"}           # 査読誌 / ワーキングペーパー・プレプリント / ウェブページ / 本
TRACKS = {"causal", "structural", "method", "meta", ""}  # meta = 研究の進め方・評価・再現性など
DEPTHS = {"full", "abstract", "biblio"}               # 本文まで読んだ / 要旨まで / 書誌だけ
CITE = re.compile(r"\\(?:cite|parencite|textcite|citep|citet|autocite)\*?(?:\[[^\]]*\])*\{([^}]+)\}")


def read():
    with open(MASTER, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(rows):
    rows.sort(key=lambda r: r["id"])
    with open(MASTER, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in COLS})


def problems(rows):
    """(誤りのリスト, 注意のリスト) を返す。誤りがあると check は終了コード 1。"""
    err, warn, seen, dois = [], [], set(), {}
    for r in rows:
        k = r["id"]
        if not re.fullmatch(r"[a-z][a-z0-9]*", k):
            err.append(f"{k}: id は英小文字と数字だけ（第一著者の姓+年。例 angrist2010）")
        if k in seen:
            err.append(f"{k}: id が重複")
        seen.add(k)
        if r["type"] not in TYPES:
            err.append(f"{k}: type は {sorted(TYPES)} のどれか")
        if r["track"] not in TRACKS:
            err.append(f"{k}: track は {sorted(t for t in TRACKS if t)} のどれか")
        if r["read_depth"] not in DEPTHS:
            err.append(f"{k}: read_depth は {sorted(DEPTHS)} のどれか")
        if not r["title"] or not r["authors"]:
            err.append(f"{k}: title と authors は必須")
        if r["type"] == "article" and not r["doi"]:
            err.append(f"{k}: 査読誌の論文には DOI が要る")
        if r["type"] in ("wp", "online") and not (r["url"] and r["urldate"]):
            err.append(f"{k}: {r['type']} には url と urldate（閲覧日）が要る")
        if r["doi"]:
            d = r["doi"].lower()
            if d.startswith("http"):
                err.append(f"{k}: doi に https://doi.org/ を付けない")
            if d in dois:
                err.append(f"{k}: DOI が {dois[d]} と重複")
            dois[d] = k
            if r["doi_ok"] == "no":
                err.append(f"{k}: DOI の照合に失敗している。直すまで引用しない")
            elif r["doi_ok"] != "yes":
                warn.append(f"{k}: DOI が未照合（tools/litdb.py verify）")
        if r["read_depth"] == "biblio" and re.search(r"\d", r["key_finding"]):
            err.append(f"{k}: 書誌しか見ていない文献の key_finding に数値を書かない")
        if r["importance"] and r["importance"] not in "12345":
            err.append(f"{k}: importance は 1〜5")
    return err, warn


def cmd_check(_):
    rows = read()
    err, warn = problems(rows)
    for m in err:
        print("  誤り:", m)
    for m in warn:
        print("  注意:", m)
    print(f"{len(rows)} 件。誤り {len(err)} 件、注意 {len(warn)} 件。")
    sys.exit(1 if err else 0)


def cmd_verify(args):
    sys.path.insert(0, str(ROOT / "tools"))
    import verify_dois as v
    from difflib import SequenceMatcher
    rows, today, n_ok, n_ng = read(), datetime.date.today().isoformat(), 0, 0
    for r in rows:
        if not r["doi"] or (r["doi_ok"] == "yes" and "--all" not in args):
            continue
        try:
            m = v.crossref(r["doi"])
        except RuntimeError as e:
            print(f"  --   {r['id']}: {e}（未照合のまま）")
            continue
        ok, why = False, "Crossref に無い"
        if m is not None:
            title = (m.get("title") or [""])[0]
            years = {str(m[k]["date-parts"][0][0]) for k in ("issued", "published-print", "published-online")
                     if m.get(k, {}).get("date-parts", [[None]])[0][0]}
            sim = SequenceMatcher(None, v.norm(r["title"]), v.norm(title)).ratio()
            ok = sim >= 0.9 and r["year"] in years
            why = f"題名の一致度 {sim:.2f}、Crossref の年 {sorted(years)}、題名 {title!r}"
        r["doi_ok"], r["doi_checked"] = ("yes" if ok else "no"), today
        n_ok, n_ng = n_ok + ok, n_ng + (not ok)
        print(f"  {'OK' if ok else 'NG'}   {r['id']}" + ("" if ok else f": {why}"))
    write(rows)
    print(f"照合 {n_ok + n_ng} 件（一致 {n_ok}、不一致 {n_ng}）。")
    sys.exit(1 if n_ng else 0)


def cmd_merge(_):
    rows = read()
    ids = {r["id"] for r in rows}
    dois = {r["doi"].lower() for r in rows if r["doi"]}
    urls = {r["url"] for r in rows if r["url"]}
    added = skipped = 0
    for f in sorted(INCOMING.glob("*.csv")):
        with open(f, newline="", encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                if (r.get("doi") and r["doi"].lower() in dois) or (not r.get("doi") and r.get("url") in urls):
                    skipped += 1
                    continue
                base, k, n = r["id"], r["id"], 0
                while k in ids:                      # id の衝突には a, b, … を付ける
                    k, n = base + "abcdefghijklmnopqrstuvwxyz"[n], n + 1
                if k != base:
                    print(f"  {f.name}: id {base} → {k}（衝突）")
                r["id"] = k
                r["doi_ok"], r["doi_checked"] = "", ""   # 統合後に必ず照合し直す
                r.setdefault("added", datetime.date.today().isoformat())
                ids.add(k)
                dois.add((r.get("doi") or "").lower())
                urls.add(r.get("url") or "")
                rows.append(r)
                added += 1
    write(rows)
    print(f"追加 {added} 件、重複で除外 {skipped} 件。次に verify と check を実行する。")


def openalex_pdf(doi):
    """OpenAlex で、合法に公開されている版の PDF の URL を探す。無ければ空文字。送るのは DOI だけ。"""
    import json
    import urllib.error
    import urllib.parse
    import urllib.request
    url = "https://api.openalex.org/works/doi:" + urllib.parse.quote(doi, safe="/")
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "litdb/1.0 (bibliography tool)"}), timeout=20) as r:
            m = json.load(r)
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None
    locs = [m.get("best_oa_location") or {}] + (m.get("locations") or [])
    for loc in locs:
        if loc.get("is_oa") and loc.get("pdf_url"):
            return loc["pdf_url"]
    return ""


def cmd_pdf(args):
    """pdf_url が空の行を埋める。arXiv は URL から作り、DOI つきは OpenAlex が公開版と記録している場所だけを使う。"""
    rows, found, none = read(), 0, 0
    for r in rows:
        if r.get("pdf_url") and "--all" not in args:
            continue
        pdf = ""
        m = re.match(r"https?://arxiv\.org/abs/(.+)", r["url"] or "")
        if m:
            pdf = f"https://arxiv.org/pdf/{m.group(1)}"
        elif (r["url"] or "").lower().endswith(".pdf"):
            pdf = r["url"]
        elif r["doi"]:
            pdf = openalex_pdf(r["doi"])
            if pdf is None:
                print(f"  --   {r['id']}: OpenAlex に接続できない")
                continue
        r["pdf_url"] = pdf
        found, none = found + bool(pdf), none + (not pdf)
        print(f"  {'PDF' if pdf else '無し'}  {r['id']}  {pdf}")
    write(rows)
    print(f"公開 PDF あり {found} 件、見つからず {none} 件。見つからない文献は、DOI のリンクだけになる。")


def bib_entry(r):
    kind = {"article": "article", "wp": "online", "online": "online", "book": "book"}[r["type"]]
    f = [("author", r["authors"]), ("title", r["title"])]
    if kind == "article":
        f += [("journal", r["venue"]), ("year", r["year"]), ("volume", r["volume"]), ("number", r["number"]), ("pages", r["pages"]), ("doi", r["doi"])]
    elif kind == "book":
        f += [("publisher", r["venue"]), ("year", r["year"]), ("doi", r["doi"])]
    else:
        f += [("year", r["year"]), ("note", r["venue"]), ("doi", r["doi"]), ("url", r["url"]), ("urldate", r["urldate"])]
    body = "\n".join(f"  {k} = {{{v}}}," for k, v in f if v)
    return f"@{kind}{{{r['id']},\n{body}\n}}\n"


def cmd_bib(args):
    rows = {r["id"]: r for r in read()}
    bad = 0
    for d in args:
        base = ROOT / d
        keys = []
        for tex in sorted((base / "paper").rglob("*.tex")):
            text = re.sub(r"(?<!\\)%.*", "", tex.read_text(encoding="utf-8"))
            for m in CITE.finditer(text):
                keys += [k.strip() for k in m.group(1).split(",")]
        keys = sorted(set(keys))
        missing = [k for k in keys if k not in rows]
        unverified = [k for k in keys if k in rows and rows[k]["doi"] and rows[k]["doi_ok"] != "yes"]
        for k in missing:
            print(f"  誤り: {d}: \\cite{{{k}}} がマスター表に無い")
        for k in unverified:
            print(f"  誤り: {d}: {k} の DOI が照合済みでない")
        bad += len(missing) + len(unverified)
        out = base / "common/refs.bib"
        out.parent.mkdir(exist_ok=True)
        out.write_text("% literature/papers.csv から tools/litdb.py bib が生成した。手で直さない。\n\n"
                       + "\n".join(bib_entry(rows[k]) for k in keys if k in rows), encoding="utf-8")
        print(f"{out.relative_to(ROOT)}: {len(keys) - len(missing)} 件")
    sys.exit(1 if bad else 0)


def cmd_stats(_):
    rows = read()
    def count(col):
        c = {}
        for r in rows:
            c[r[col] or "（空）"] = c.get(r[col] or "（空）", 0) + 1
        return "、".join(f"{k} {v}" for k, v in sorted(c.items(), key=lambda x: -x[1]))
    print(f"{len(rows)} 件")
    for col, name in (("read_depth", "読んだ深さ"), ("track", "トラック"), ("type", "種類"), ("doi_ok", "DOI 照合")):
        print(f"  {name}: {count(col)}")


def main():
    cmds = {"check": cmd_check, "verify": cmd_verify, "merge": cmd_merge, "bib": cmd_bib, "pdf": cmd_pdf, "stats": cmd_stats}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        sys.exit(__doc__)
    cmds[sys.argv[1]](sys.argv[2:])


if __name__ == "__main__":
    main()
