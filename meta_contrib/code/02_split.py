"""標本を決め、探索用30%と確証用70%に分ける。人の正解づけ用の80本も選ぶ。

- 入力: data/raw/works.jsonl（01_fetch.py の出力）
- 標本: 研究論文（題目で年報・表紙などを除く。01_fetch.py と同じ条件）のうち、要旨が50語以上ある論文。雑誌ごとに最大 CAP 本を無作為に取る（全部が CAP 未満なら全部）。
- 分割: 雑誌ごとに層を切り、30% を探索用、70% を確証用にする。
- 正解づけ用（research/labeling_protocol.md）: 探索用から、雑誌ごとにほぼ同数の無作為60本と、
  決めておいた語を要旨に含む論文20本（誤りを正す10本・流行の題材10本）。表では順番を混ぜ、どちらの標本かは出さない。
  正解づけの表には雑誌名・年・著者を出さない。
- 出力: data/derived/sample.csv（openalex_id, journal, year, split, label_set）
        data/derived/label_sheet.csv（正解づけの表。id・題目・要旨と、空の判断の列）
- 乱数の種は固定する。格（結果変数）との突き合わせはしない。
"""
import csv, json, random, re, sys
from pathlib import Path as _P
sys.path.insert(0, str(_P(__file__).resolve().parent))
import importlib.util as _u
_s = _u.spec_from_file_location("fetch", _P(__file__).resolve().parent / "01_fetch.py")
_f = _u.module_from_spec(_s); _s.loader.exec_module(_f)
NONRESEARCH = _f.NONRESEARCH  # 01_fetch.py と同じ条件で、研究論文でないものを除く
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = 20261124
CAP = 300          # 1誌あたりの上限（仮。ロック前に決める）
EXPLORE = 0.30
N_LABEL_RANDOM = 60
KW_C1 = ["misleading", "biased", "invalid", "incorrect", "commonly used", "widely used", "standard practice", "fails to"]
KW_B = ["cryptocurrenc", "bitcoin", "blockchain", "covid", "pandemic", "esg", "machine learning",
        "artificial intelligence", "big data"]
N_KW = 10  # 語ごとの群から各10本
LABEL_COLS = ["T", "C1", "X", "C2", "G", "B", "S1", "S2", "S3", "known", "memo"]
MIN_WORDS = 50


def main():
    rng = random.Random(SEED)
    by_j = defaultdict(list)
    for line in open(ROOT / "data/raw/works.jsonl"):
        w = json.loads(line)
        if NONRESEARCH.search(w["title"]):
            continue
        if len(w["abstract"].split()) >= MIN_WORDS:
            by_j[w["journal"]].append(w)
    rows, explore_by_j = [], {}
    for j in sorted(by_j):
        ws = sorted(by_j[j], key=lambda w: w["openalex_id"])
        rng.shuffle(ws)
        ws = ws[:CAP]
        k = round(len(ws) * EXPLORE)
        explore_by_j[j] = ws[:k]
        for i, w in enumerate(ws):
            rows.append(dict(openalex_id=w["openalex_id"], journal=j, year=w["year"],
                             split="explore" if i < k else "confirm", label_set=""))
    # 正解づけ用: 無作為60本（雑誌ごとにほぼ同数）＋語で選ぶ20本
    js = sorted(explore_by_j)
    per = N_LABEL_RANDOM // len(js)
    extra = N_LABEL_RANDOM - per * len(js)
    picked, kind = [], {}
    for i, j in enumerate(js):
        for w in explore_by_j[j][: per + (1 if i < extra else 0)]:
            picked.append(w); kind[w["openalex_id"]] = "random"
    rest = [w for j in js for w in explore_by_j[j] if w["openalex_id"] not in kind]
    rest.sort(key=lambda w: w["openalex_id"])
    for label, kws in (("kw_C1", KW_C1), ("kw_B", KW_B)):
        cands = [w for w in rest if w["openalex_id"] not in kind
                 and any(k in (w["title"] + " " + w["abstract"]).lower() for k in kws)]
        rng.shuffle(cands)
        for w in cands[:N_KW]:
            picked.append(w); kind[w["openalex_id"]] = label
    rng.shuffle(picked)
    for r in rows:
        r["label_set"] = kind.get(r["openalex_id"], "")
    out = ROOT / "data/derived"
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "sample.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    with open(out / "label_sheet.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["openalex_id", "title", "abstract"] + LABEL_COLS)
        for p in picked:
            w.writerow([p["openalex_id"], p["title"], p["abstract"]] + [""] * len(LABEL_COLS))
    n = defaultdict(lambda: [0, 0])
    for r in rows:
        n[r["journal"]][r["split"] == "confirm"] += 1
    for j in sorted(n):
        print(f"{j}: 探索 {n[j][0]}、確証 {n[j][1]}")
    print(f"計 {len(rows)} 本。正解づけ用 {len(picked)} 本（{dict((v, list(kind.values()).count(v)) for v in set(kind.values()))}）。種 {SEED}")


if __name__ == "__main__":
    main()
