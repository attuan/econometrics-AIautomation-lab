#!/usr/bin/env python3
"""段階1: テーマの採点表から、4群の点と合計点を出す。

    python3 tools/score_themes.py [--themes CSV] [--axes CSV] [--out CSV] [--top N]

- 軸に重みは付けない。重く見たい項目があれば、その群や軸の点を直接見る（星取り表で並べ替える）。
- 群の点 = 群に属する軸の平均 × 20（20〜100点）。群は「問いの価値・信頼性・実行可能性・競争と出口」。
- 合計点 = 4群の点の幾何平均。1つの群が弱いと全体が下がる。
- 根拠の無い点は上限2点にする: N は nearest 欄（いちばん近い既存研究3本との差）、D は data_check 欄
  （データ名と必要な変数の確認）が空なら、2点を上限として計算する。
軸・選ぶときの条件の定義は theme/research/00_plan.md。
"""
import argparse
import csv
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = {"N": "nearest", "D": "data_check"}  # 軸 → 根拠を書く列。空なら上限 CAP 点
CAP = 2
# 選ぶときの条件（上位10個の組合せ）。portal/assets/themes.js も同じ値を使う
PORTFOLIO = {"max_same_design": 4, "min_per_track": 2, "size": 10}


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load(themes_path=ROOT / "theme/research/themes.csv", axes_path=ROOT / "theme/research/axes.csv"):
    """採点して、(行のリスト, 軸のリスト, 軸の行, 群のリスト) を返す。portal/build.py からも使う。"""
    arows = read_csv(axes_path)
    axes = [r["axis"] for r in arows]
    groups = list(dict.fromkeys(r["group"] for r in arows))
    out = []
    for t in read_csv(themes_path):
        try:
            s = {a: float(t[a]) for a in [*axes, "K"]}
        except (KeyError, ValueError) as e:
            sys.exit(f"{t.get('id', '?')}: 軸の点が読めません（{e}）")
        bad = [a for a in s if not 1 <= s[a] <= 5]
        if bad:
            sys.exit(f"{t['id']}: 1–5 の範囲外の軸 {bad}")
        row = dict(t)
        capped = []
        for a, col in EVIDENCE.items():
            if not (t.get(col) or "").strip() and s[a] > CAP:
                row[f"raw_{a}"], s[a] = t[a], float(CAP)
                row[a] = str(CAP)
                capped.append(a)
        row["capped"] = " ".join(capped)
        log_sum = 0.0
        for i, g in enumerate(groups, 1):
            members = [r["axis"] for r in arows if r["group"] == g]
            score = 20 * sum(s[a] for a in members) / len(members)
            row[f"g{i}"] = round(score, 1)
            log_sum += math.log(score)
        row["total"] = round(math.exp(log_sum / len(groups)), 1)
        out.append(row)
    out.sort(key=lambda r: -r["total"])
    for i, r in enumerate(out, 1):
        r["pos"] = i
    return out, axes, arows, groups


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--themes", default=ROOT / "theme/research/themes.csv")
    ap.add_argument("--axes", default=ROOT / "theme/research/axes.csv")
    ap.add_argument("--out", default=ROOT / "theme/research/scored.csv")
    ap.add_argument("--top", type=int, default=0, help="上位 N 件を表示する")
    args = ap.parse_args()

    out, axes, _, groups = load(args.themes, args.axes)
    if not out:
        sys.exit(f"{args.themes} にテーマがありません。00_plan.md の列で行を足してください。")
    gcols = [f"g{i}" for i in range(1, len(groups) + 1)]
    cols = ["pos", "id", "track", "design", "cluster", "theme", "total", *gcols, "capped", *axes, "K", "status"]
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(out)
    print(f"{len(out)} 件を {args.out} に書いた（合計点の順）。群: " + " / ".join(f"g{i}={g}" for i, g in enumerate(groups, 1)))
    if args.top:
        print(" ".join(["pos", "id", "track", "total", *gcols, "上限2", "theme"]))
        for r in out[: args.top]:
            print(r["pos"], r["id"], r["track"], r["total"], *(r[c] for c in gcols), r["capped"] or "-", r["theme"])


if __name__ == "__main__":
    main()
