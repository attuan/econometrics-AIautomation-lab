"""01_fetch.py で要旨が取れなかった論文を補う。

1. Semantic Scholar を、429（回数制限）のときに待って取り直す。
2. まだ欠けている論文は、RePEc（IDEAS）の雑誌の一覧ページから題目で探し、論文ページの要旨を取る。
   IDEAS には 1 秒に 1 回までしか問い合わせない。一覧ページと論文ページは data/raw/ideas_cache/ に保存し、再実行では取り直さない。
- 入力・出力: data/raw/works.jsonl（上書き。abstract_source に semanticscholar / repec を記録）、data/derived/coverage.csv
- RePEc の一括ファイル（ftp.repec.org）は TLS 証明書の不一致で使えなかった（2026-11-24）ので、IDEAS のページを使う。
"""
import csv, hashlib, html, json, os, re, sys, time, unicodedata, urllib.error, urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.envload import load_env  # noqa: E402

load_env()
UA = {"User-Agent": "econ-lab-meta/0.1"}
S2_KEY = os.environ.get("SEMANTIC_SCHOLAR_API_KEY", "")
CACHE_DIR = ROOT / "data/raw/ideas_cache"
# RePEc の雑誌の識別子（IDEAS の /s/<id>.html が存在することを 2026-11-24 に確認）
SERIES = {
    "Econometrica": "ecm/emetrp", "Journal of Econometrics": "eee/econom", "Econometric Theory": "cup/etheor",
    "International Journal of Forecasting": "eee/intfor", "Empirical Economics": "spr/empeco",
    "Econometrics and Statistics": "eee/ecosta", "Journal of Quantitative Economics": "spr/jqecon",
    "Journal of Financial Econometrics": "oup/jfinec", "The Review of Economics and Statistics": "tpr/restat",
}
_last = [0.0]


def norm(t):
    t = unicodedata.normalize("NFKD", html.unescape(t or "")).lower()
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def fetch_ideas(path):
    """IDEAS のページを取る（キャッシュあり、1秒に1回まで）"""
    f = CACHE_DIR / (hashlib.sha1(path.encode()).hexdigest() + ".html")
    if f.exists():
        return f.read_text(errors="replace")
    wait = 1.0 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    try:
        with urllib.request.urlopen(urllib.request.Request("https://ideas.repec.org" + path, headers=UA), timeout=60) as r:
            t = r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            t = ""
        else:
            raise
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(t)
    return t


def ideas_index(series, years=(2015, 2024)):
    """雑誌の一覧ページを新しい順にたどり、(年, 題目) → 論文ページのパス を作る"""
    base = series.split("/")[1]
    idx, page = {}, 1
    while True:
        name = f"/s/{series}.html" if page == 1 else f"/s/{series}{page}.html"
        t = fetch_ideas(name)
        items = re.findall(r'<A HREF="(/a/' + re.escape(series) + r'/[^"]+)">(.*?)</A>', t, flags=re.I | re.S)
        if not items:
            break
        ys = []
        for href, title in items:
            m = re.search(r"y(\d{4})", href)
            y = int(m.group(1)) if m else None
            ys.append(y)
            if y and years[0] - 1 <= y <= years[1] + 1:
                idx.setdefault((y, norm(re.sub("<[^>]+>", "", title))), href)
        if all(y is not None and y < years[0] - 1 for y in ys):
            break
        page += 1
        if page > 200:
            break
    return idx


def ideas_abstract(href):
    t = fetch_ideas(href)
    m = re.search(r'<div id="abstract-body">(.*?)</div>', t, re.S)
    if not m:
        return ""
    a = html.unescape(re.sub(r"<[^>]+>", " ", m.group(1)))
    a = re.sub(r"\s+", " ", a).strip()
    return "" if a.lower().startswith("no abstract is available") else a


def s2_retry(dois):
    got = {}
    h = {**UA, "Content-Type": "application/json", **({"x-api-key": S2_KEY} if S2_KEY else {})}
    for i in range(0, len(dois), 500):
        chunk = dois[i:i + 500]
        body = json.dumps({"ids": ["DOI:" + d for d in chunk]}).encode()
        for k in range(6):
            try:
                req = urllib.request.Request("https://api.semanticscholar.org/graph/v1/paper/batch?fields=abstract", data=body, headers=h)
                res = json.load(urllib.request.urlopen(req, timeout=120)); break
            except urllib.error.HTTPError as e:
                if e.code == 429 and k < 5:
                    time.sleep(10 * 2 ** k); continue
                print("  S2 error", e.code, file=sys.stderr); res = [None] * len(chunk); break
        for d, x in zip(chunk, res):
            if x and x.get("abstract"):
                got[d] = x["abstract"]
        time.sleep(3)
    return got


def main():
    path = ROOT / "data/raw/works.jsonl"
    works = [json.loads(l) for l in open(path)]
    miss = [w for w in works if not w["abstract"]]
    print(f"欠け {len(miss)} 本", flush=True)
    s2 = s2_retry([w["doi"] for w in miss if w["doi"]])
    for w in miss:
        if w["doi"] in s2:
            w["abstract"], w["abstract_source"] = s2[w["doi"]], "semanticscholar"
    print(f"Semantic Scholar で {len(s2)} 本補った", flush=True)
    by_j = defaultdict(list)
    for w in works:
        if not w["abstract"] and w["journal"] in SERIES:
            by_j[w["journal"]].append(w)
    for j, ws in by_j.items():
        idx = ideas_index(SERIES[j])
        hit = 0
        for w in ws:
            key = norm(w["title"])
            href = next((idx[(y, key)] for y in (w["year"], w["year"] - 1, w["year"] + 1) if (y, key) in idx), None)
            if href:
                a = ideas_abstract(href)
                if a:
                    w["abstract"], w["abstract_source"] = a, "repec"; hit += 1
        print(f"{j}: IDEAS 一覧 {len(idx)} 件、欠け {len(ws)} 本中 {hit} 本を補った", flush=True)
    with open(path, "w") as f:
        for w in works:
            f.write(json.dumps(w, ensure_ascii=False) + "\n")
    cov = defaultdict(lambda: [0, 0])
    for w in works:
        c = cov[(w["journal"], w["year"])]; c[0] += 1; c[1] += bool(w["abstract"])
    with open(ROOT / "data/derived/coverage.csv", "w", newline="") as f:
        wr = csv.writer(f); wr.writerow(["journal", "year", "n", "n_abstract"])
        for (j, y), (n, a) in sorted(cov.items()):
            wr.writerow([j, y, n, a])
    tot = Counter(); got = Counter()
    for w in works:
        tot[w["journal"]] += 1; got[w["journal"]] += bool(w["abstract"])
    for j in tot:
        print(f"  {j}: {got[j]}/{tot[j]}（{got[j] / tot[j]:.0%}）")
    src = Counter(w.get("abstract_source") or "なし" for w in works)
    print("要旨の出所:", dict(src))


if __name__ == "__main__":
    main()
