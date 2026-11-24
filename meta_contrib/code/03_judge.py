"""題目と要旨に、questions/questions.toml の質問を OpenAI Decisions API で当てる。

- 入力: data/raw/works.jsonl、data/derived/sample.csv（02_split.py の出力）、questions/questions.toml
- 決定モデルに渡すのは題目と要旨だけ。雑誌名・著者・年は渡さない。
- 1論文1リクエスト（全質問をまとめて送る。上限400問）。
- キャッシュ: data/derived/judge_cache.jsonl（論文 id × 質問文のハッシュ）。質問文を変えたら、その質問だけ取り直す。
- 出力: data/derived/predicates.csv（openalex_id, qid, p）。格との突き合わせはしない。
- 使い方: python3 code/03_judge.py [--split explore|confirm|all] [--limit N] [--ids FILE] [--workers 8]
  キーはリポジトリ直下の .env から読む（値は表示しない）。
"""
import argparse, csv, hashlib, json, os, sys, threading, time, tomllib, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.envload import load_env  # noqa: E402

load_env()
MODEL = "gpt-6-luna"
URL = "https://api.openai.com/v1/decisions"
CACHE = ROOT / "data/derived/judge_cache.jsonl"
lock = threading.Lock()


def qhash(text):
    return hashlib.sha256(f"{MODEL}\n{text}".encode()).hexdigest()[:16]


def call(input_text, questions, tries=6):
    body = json.dumps({"model": MODEL, "input": input_text, "questions": questions}).encode()
    for i in range(tries):
        req = urllib.request.Request(URL, data=body, headers={
            "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"], "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < tries - 1:
                time.sleep(2 ** i * 2); continue
            raise RuntimeError(f"HTTP {e.code}: {e.read()[:300]!r}")
        except urllib.error.URLError:
            if i < tries - 1:
                time.sleep(2 ** i * 2); continue
            raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", default="explore", choices=["explore", "confirm", "all"])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--ids", default="", help="論文 id を1行1件で書いたファイル（指定すると --split より優先）")
    a = ap.parse_args()

    cfg = tomllib.load(open(ROOT / "questions/questions.toml", "rb"))
    pre = cfg["preamble"]
    qs = cfg["q"]
    works = {}
    for line in open(ROOT / "data/raw/works.jsonl"):
        w = json.loads(line); works[w["openalex_id"]] = w
    ids = [r["openalex_id"] for r in csv.DictReader(open(ROOT / "data/derived/sample.csv"))
           if a.split == "all" or r["split"] == a.split]
    if a.ids:
        ids = [l.strip() for l in open(a.ids) if l.strip()]
    if a.limit:
        ids = ids[: a.limit]

    cache = {}
    if CACHE.exists():
        for line in open(CACHE):
            c = json.loads(line); cache[(c["id"], c["h"])] = c["p"]

    def todo_for(pid):
        return [q for q in qs if (pid, qhash(q["text"])) not in cache]

    jobs = [(pid, todo_for(pid)) for pid in ids]
    jobs = [(pid, t) for pid, t in jobs if t]
    print(f"{len(ids)} 本中、取り直しが要るのは {len(jobs)} 本（{sum(len(t) for _, t in jobs)} 問）", flush=True)

    tokens = 0
    errors = 0
    out = open(CACHE, "a")

    def work(pid, todo):
        w = works[pid]
        text = f"{pre}\n\nTitle: {w['title']}\n\nAbstract: {w['abstract']}"
        r = call(text, [{"type": "predicate", "name": q["id"], "instructions": q["text"]} for q in todo])
        byname = {x.get("name"): x for x in r["answers"]}
        rows = []
        for q in todo:
            x = byname.get(q["id"], {})
            p = x.get("probability") if x.get("type") == "predicate" else None  # 拒否は None
            rows.append({"id": pid, "qid": q["id"], "h": qhash(q["text"]), "p": p})
        return rows, r.get("usage", {}).get("input_tokens", 0)

    with ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(work, pid, t): pid for pid, t in jobs}
        for n, f in enumerate(as_completed(futs), 1):
            try:
                rows, tk = f.result()
            except Exception as e:  # noqa: BLE001
                errors += 1
                print("  失敗", futs[f], str(e)[:120], file=sys.stderr); continue
            tokens += tk
            with lock:
                for r in rows:
                    out.write(json.dumps(r) + "\n"); cache[(r["id"], r["h"])] = r["p"]
                out.flush()
            if n % 200 == 0:
                print(f"  {n}/{len(jobs)} 本、入力 {tokens:,} トークン", flush=True)
    out.close()

    with open(ROOT / "data/derived/predicates.csv", "w", newline="") as f:
        wr = csv.writer(f); wr.writerow(["openalex_id", "qid", "p"])
        for pid in ids:
            for q in qs:
                wr.writerow([pid, q["id"], cache.get((pid, qhash(q["text"])))])
    print(f"完了。入力 {tokens:,} トークン（約 ${tokens / 1e6 * 0.10:.2f}）。失敗 {errors} 本。", flush=True)


if __name__ == "__main__":
    main()
