"""H23: 人の正解と決定モデルの判定を照合する（research/labeling_protocol.md 第5節）。

- 入力: data/derived/label_sheet_<名前>_<日付>.csv（正解づけの画面が書き出したもの。複数あれば人どうしの κ も出す）
        data/derived/predicates.csv（03_judge.py の出力）、data/derived/sample.csv（label_set）、questions/questions.toml
- 出力: data/derived/h23_agreement.csv（型ごと × 標本〈無作為60本／80本全体〉の n・はいの数・正解率・AUC・κ）
- 格（結果変数）は使わない。
- 使い方: python3 code/05_label_eval.py [正解づけのCSV ...]（省略時は data/derived/label_sheet_*_*.csv をすべて使う）
"""
import csv, sys, tomllib
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "data/derived"
# 型 → 決定モデルの質問の set（questions.toml）
TYPE_SETS = {"C1": "H01", "X": "H02", "C2": "H03", "G": "H07", "B": "H16"}
S_ITEMS = {"S1": "Sa", "S2": "Sb", "S3": "Sc"}
MIN_POS = 8  # はいが これ未満の型は「判定できない」


def auc(scores, labels):
    pos = [s for s, l in zip(scores, labels) if l == 1]
    neg = [s for s, l in zip(scores, labels) if l == 0]
    if not pos or not neg:
        return None
    win = sum((p > n) + 0.5 * (p == n) for p in pos for n in neg)
    return win / (len(pos) * len(neg))


def kappa(a, b, cats):
    n = len(a)
    if n == 0:
        return None
    po = sum(x == y for x, y in zip(a, b)) / n
    pe = sum((a.count(c) / n) * (b.count(c) / n) for c in cats)
    return None if pe == 1 else (po - pe) / (1 - pe)


def model_scores():
    cfg = tomllib.load(open(ROOT / "questions/questions.toml", "rb"))
    sets = defaultdict(list)
    for q in cfg["q"]:
        sets[q["set"]].append(q["id"])
    p = defaultdict(dict)
    for r in csv.DictReader(open(D / "predicates.csv")):
        if r["p"] not in ("", "None"):
            p[r["openalex_id"]][r["qid"]] = float(r["p"])
    out = defaultdict(dict)
    for pid, d in p.items():
        for t, s in TYPE_SETS.items():
            v = [d[q] for q in sets[s] if q in d]
            if v:
                out[pid][t] = sum(v) / len(v)
        for t, q in S_ITEMS.items():
            if q in d:
                out[pid][t] = d[q]
        pt = {k: d.get(q) for k, q in (("M", "P1"), ("A", "P2"), ("T", "P3")) if d.get(q) is not None}
        if pt:
            k, v = max(pt.items(), key=lambda kv: kv[1])
            out[pid]["T"] = k if v >= 0.5 else "O"
    return out


def read_labels(path):
    return {r["openalex_id"]: r for r in csv.DictReader(open(path, encoding="utf-8-sig"))}


def main():
    files = [Path(f) for f in sys.argv[1:]] or sorted(D.glob("label_sheet_*_*.csv"))
    if not files:
        sys.exit("正解づけの CSV が無い（label_sheet_<名前>_<日付>.csv）")
    main_lab = read_labels(files[0])
    kind = {r["openalex_id"]: r["label_set"] for r in csv.DictReader(open(D / "sample.csv")) if r["label_set"]}
    m = model_scores()
    rows = []
    for subset in ("random", "all"):
        ids = [i for i in main_lab if i in kind and (subset == "all" or kind[i] == "random")]
        for t in ["T", *TYPE_SETS, *S_ITEMS]:
            if t == "T":
                pairs = [(main_lab[i]["T"], m[i].get("T")) for i in ids if main_lab[i].get("T") in "MATO" and main_lab[i].get("T") and m[i].get("T")]
                h, mm = [a for a, _ in pairs], [b for _, b in pairs]
                acc = sum(a == b for a, b in pairs) / len(pairs) if pairs else None
                rows.append(dict(type=t, subset=subset, n=len(pairs), n_yes="", n_unsure="", accuracy=acc,
                                 auc="", kappa=kappa(h, mm, list("MATO")), note=""))
                continue
            use = [i for i in ids if (t not in S_ITEMS or main_lab[i].get("T") == "M")]
            unsure = sum(main_lab[i].get(t) == "?" for i in use)
            pairs = [(int(main_lab[i][t]), m[i][t]) for i in use if main_lab[i].get(t) in ("0", "1") and t in m[i]]
            lab = [a for a, _ in pairs]; sc = [b for _, b in pairs]
            pred = [int(s >= 0.5) for s in sc]
            npos = sum(lab)
            rows.append(dict(type=t, subset=subset, n=len(pairs), n_yes=npos, n_unsure=unsure,
                             accuracy=(sum(a == b for a, b in zip(lab, pred)) / len(lab)) if lab else None,
                             auc=auc(sc, lab), kappa=kappa(lab, pred, [0, 1]),
                             note="判定できない（はいが少ない）" if npos < MIN_POS else ""))
    # 人どうしの一致（2人目のファイルがあれば）
    for f in files[1:]:
        other = read_labels(f)
        common = [i for i in other if i in main_lab]
        for t in ["T", *TYPE_SETS]:
            a = [main_lab[i].get(t, "") for i in common if main_lab[i].get(t) not in ("", "?") and other[i].get(t) not in ("", "?")]
            b = [other[i].get(t, "") for i in common if main_lab[i].get(t) not in ("", "?") and other[i].get(t) not in ("", "?")]
            rows.append(dict(type=t, subset=f"人どうし:{f.stem}", n=len(a), n_yes="", n_unsure="", accuracy="",
                             auc="", kappa=kappa(a, b, sorted(set(a) | set(b))), note=""))
    with open(D / "h23_agreement.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    for r in rows:
        fmt = lambda v: "" if v in (None, "") else (f"{v:.2f}" if isinstance(v, float) else str(v))
        print(f"{r['type']:3} {r['subset']:10} n={r['n']:<3} はい={fmt(r['n_yes']):<3} 正解率={fmt(r['accuracy']):<5} AUC={fmt(r['auc']):<5} κ={fmt(r['kappa']):<5} {r['note']}")


if __name__ == "__main__":
    main()
