#!/usr/bin/env python3
"""bib ファイルの DOI を Crossref で照合する。

    python3 tools/verify_dois.py <refs.bib> [...]

各項目について、Crossref の題名・年と bib の title・year を比べる。
不一致・未登録・DOI なし（@online 以外）があれば終了コード 1。
Crossref に送るのは DOI だけ。
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from difflib import SequenceMatcher

ENTRY = re.compile(r"@(\w+)\s*\{\s*([^,\s]+)\s*,(.*?)\n\}", re.S)
UA = "verify-dois/1.0 (bibliography checker)"


def field(body, name):
    m = re.search(rf"\b{name}\s*=\s*(?:\{{((?:[^{{}}]|\{{[^{{}}]*\}})*)\}}|\"([^\"]*)\"|(\d+))", body, re.I)
    return re.sub(r"\s+", " ", next(g for g in m.groups() if g is not None)).strip() if m else ""


def norm(s):
    s = re.sub(r"<[^>]+>|\\[a-zA-Z]+|[{}$]", "", s)
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def crossref(doi):
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (0, 2, 5):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)["message"]
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
        except (urllib.error.URLError, TimeoutError):
            pass
    raise RuntimeError("Crossref に接続できない")


def check(path):
    text = open(path, encoding="utf-8").read()
    problems = 0
    for kind, key, body in ENTRY.findall(text):
        doi, title, year = field(body, "doi"), field(body, "title"), field(body, "year") or field(body, "date")[:4]
        if not doi:
            if kind.lower() in ("online", "misc", "book", "techreport", "unpublished", "report"):
                print(f"  --   {key}: DOI なし（@{kind}。URL と閲覧日を確認）")
            else:
                print(f"  NG   {key}: DOI がない")
                problems += 1
            continue
        try:
            m = crossref(doi)
        except RuntimeError as e:
            print(f"  NG   {key}: {e}")
            problems += 1
            continue
        if m is None:
            print(f"  NG   {key}: Crossref に無い DOI {doi}")
            problems += 1
            continue
        cr_title = (m.get("title") or [""])[0]
        years = {str(m[k]["date-parts"][0][0]) for k in ("issued", "published-print", "published-online") if m.get(k, {}).get("date-parts", [[None]])[0][0]}
        sim = SequenceMatcher(None, norm(title), norm(cr_title)).ratio()
        if sim < 0.9:
            print(f"  NG   {key}: 題名が違う（一致度 {sim:.2f}）\n         bib:      {title}\n         Crossref: {cr_title}")
            problems += 1
        elif year not in years:
            print(f"  NG   {key}: 年が違う（bib {year} / Crossref {sorted(years)}）")
            problems += 1
        else:
            print(f"  OK   {key}")
    return problems


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    total = 0
    for p in sys.argv[1:]:
        print(p)
        total += check(p)
    print(f"問題 {total} 件")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
