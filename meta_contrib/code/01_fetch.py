"""雑誌ごとに、2015〜2024年の論文の書誌・題目・要旨を取る。

- 入力: research/journal_tiers.csv（ISSN で OpenAlex の source を引く）
- 要旨: OpenAlex の abstract_inverted_index を文に戻す。無ければ Semantic Scholar で DOI から補う。
- 出力: data/raw/works.jsonl（git に入れない。要旨の本文は再配布しない）
        data/derived/coverage.csv（雑誌×年の論文数と、要旨が取れた数。格とは突き合わせない）
- 使い方: python3 code/01_fetch.py [--only-sample]（キーはリポジトリ直下の .env から読む。雛形は .env.example）
  （--only-sample は in_sample=1 の雑誌だけ。OpenAlex はキー無しだと IP 単位の共有の無料枠しか使えない。
   キーは https://openalex.org/settings/api で無料で取れる。キーは git に入れない）
"""
import csv, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "econ-lab-meta/0.1"}
YEARS = "2015-2024"
# 研究論文でないもの（題目で除く）。除いた件数は coverage.csv に残す
# 研究論文でないもの（題目で除く。2026-11-24 に、年報・投稿規定・表紙などを足した）
NONRESEARCH = re.compile(r"(annual report|report of the|submission of manuscripts|cover and (front|back) matter|front matter|"
                         r"back matter|issue information|\bprize\b|guest editor|call for papers|\bfellows\b|nominations?\b|"
                         r"announcement|referees|corrigend|errat|editorial board|in memoriam|obituary|retraction|^index|"
                         r"^editorial|^introduction to the special issue|^correction|acknowledg|"
                         r"econometric society (annual|monograph|meeting|election))", re.I)


sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.envload import load_env  # noqa: E402  リポジトリ直下の .env から読む（値は表示しない）
load_env()
OPENALEX_KEY = os.environ.get("OPENALEX_API_KEY", "")
S2_KEY = os.environ.get("SEMANTIC_SCHOLAR_API_KEY", "")


def get(url, data=None, tries=5):
    if OPENALEX_KEY and url.startswith("https://api.openalex.org/"):
        url += ("&" if "?" in url else "?") + "api_key=" + OPENALEX_KEY
    for i in range(tries):
        try:
            h = {**UA, **({"Content-Type": "application/json"} if data else {})}
            if S2_KEY and "semanticscholar" in url:
                h["x-api-key"] = S2_KEY
            req = urllib.request.Request(url, data=data, headers=h)
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 401 and "openalex" in url:
                sys.exit("OpenAlex が 401 を返した。無料枠を使い切った可能性がある。OPENALEX_API_KEY を設定して再実行する。")
            if e.code in (429, 500, 502, 503, 504) and i < tries - 1:
                time.sleep(2 ** i * 2); continue
            raise
        except urllib.error.URLError:
            if i < tries - 1:
                time.sleep(2 ** i * 2); continue
            raise


def source_id(row):
    for issn in (row["issn_print"], row["issn_online"]):
        if issn:
            try:
                return get(f"https://api.openalex.org/sources/issn:{issn}")["id"].rsplit("/", 1)[-1]
            except urllib.error.HTTPError:
                continue
    return None


def deinvert(inv):
    if not inv:
        return ""
    pos = [(p, w) for w, ps in inv.items() for p in ps]
    return " ".join(w for _, w in sorted(pos))


def fetch_openalex(sid):
    sel = "id,doi,title,publication_year,type,abstract_inverted_index,cited_by_count"
    cursor, out = "*", []
    while cursor:
        url = (f"https://api.openalex.org/works?filter=primary_location.source.id:{sid},"
               f"publication_year:{YEARS},type:article&per-page=200&cursor={urllib.parse.quote(cursor)}&select={sel}")
        r = get(url)
        out += r["results"]
        cursor = r["meta"].get("next_cursor")
        time.sleep(0.15)
    return out


def fill_s2(dois):
    """DOI → 要旨（Semantic Scholar の batch API。500件ずつ）"""
    got = {}
    for i in range(0, len(dois), 500):
        chunk = dois[i:i + 500]
        body = json.dumps({"ids": ["DOI:" + d for d in chunk]}).encode()
        try:
            res = get("https://api.semanticscholar.org/graph/v1/paper/batch?fields=abstract", data=body)
        except urllib.error.HTTPError as e:
            print("  S2 error", e.code, file=sys.stderr); res = [None] * len(chunk)
        for d, x in zip(chunk, res):
            if x and x.get("abstract"):
                got[d] = x["abstract"]
        time.sleep(3)
    return got


def main():
    only = "--only-sample" in sys.argv
    journals = list(csv.DictReader(open(ROOT / "research/journal_tiers.csv")))
    if only:
        journals = [j for j in journals if j["in_sample"] == "1"]
    (ROOT / "data/raw").mkdir(parents=True, exist_ok=True)
    (ROOT / "data/derived").mkdir(parents=True, exist_ok=True)
    works_out = open(ROOT / "data/raw/works.jsonl", "w")
    cov = []
    for j in journals:
        sid = source_id(j)
        if not sid:
            print("NOT FOUND", j["name"]); continue
        ws = fetch_openalex(sid)
        recs, dropped = [], 0
        for w in ws:
            title = (w.get("title") or "").strip()
            if not title or NONRESEARCH.search(title):
                dropped += 1; continue
            recs.append(dict(openalex_id=w["id"].rsplit("/", 1)[-1], doi=(w.get("doi") or "").replace("https://doi.org/", "").lower(),
                             title=title, year=w["publication_year"], journal=j["name"],
                             abstract=deinvert(w.get("abstract_inverted_index")), cited_by_count=w.get("cited_by_count")))
        for r in recs:
            r["abstract_source"] = "openalex" if r["abstract"] else ""
        missing = [r["doi"] for r in recs if not r["abstract"] and r["doi"]]
        s2 = fill_s2(missing) if missing else {}
        for r in recs:
            if not r["abstract"] and r["doi"] in s2:
                r["abstract"], r["abstract_source"] = s2[r["doi"]], "semanticscholar"
        for r in recs:
            works_out.write(json.dumps(r, ensure_ascii=False) + "\n")
        by = Counter(r["year"] for r in recs)
        ab = Counter(r["year"] for r in recs if r["abstract"])
        for y in sorted(by):
            cov.append(dict(journal=j["name"], openalex_source=sid, year=y, n=by[y], n_abstract=ab[y]))
        n, a = len(recs), sum(1 for r in recs if r["abstract"])
        print(f"{j['name']}: {n} 本（題目で除外 {dropped}）、要旨あり {a}（{a / max(n, 1):.0%}。うち S2 で補完 {len(s2)}）", flush=True)
    works_out.close()
    with open(ROOT / "data/derived/coverage.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(cov[0].keys())); w.writeheader(); w.writerows(cov)


if __name__ == "__main__":
    main()
