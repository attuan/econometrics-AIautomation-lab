#!/usr/bin/env python3
"""theme/research/themes.csv から星取り表 theme/paper/gen/hoshitori.tex を作る。

    python3 theme/paper/scripts/build.py

latexmk の前に実行する。scored.csv も書き直す。
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools"))
import score_themes  # noqa: E402

TRACK = {"causal": "因果", "structural": "構造", "method": "手法"}


def main():
    rows, axes, _, groups = score_themes.load()
    lines = [
        r"\begin{table}[htbp]", r"\centering\small",
        r"\begin{tabularx}{\linewidth}{rlX" + "r" * (len(groups) + 1) + "}", r"\toprule",
        "順 & 型 & テーマ & " + " & ".join(groups) + r" & 合計 \\", r"\midrule",
    ]
    for r in rows:
        g = " & ".join(f"{r[f'g{i}']:.0f}" for i in range(1, len(groups) + 1))
        lines.append(f"{r['pos']} & {TRACK.get(r['track'], r['track'])} & {r['theme']} & {g} & {r['total']} \\\\")
    n_pilot = sum(r.get("status") == "pilot" for r in rows)
    n_cap = sum(bool(r["capped"]) for r in rows)
    lines += [
        r"\bottomrule", r"\end{tabularx}",
        rf"\caption{{星取り表（合計点の順）。群の点は20〜100、合計は4群の点の幾何平均。{len(rows)}件中{n_pilot}件が試行採点（出典未調査）、"
        rf"{n_cap}件は根拠の欄が空で、新規性かデータ入手性を上限2点で計算した。"
        r"データは \texttt{theme/research/themes.csv}。}",
        r"\label{tab:th-hoshi}", r"\end{table}", "",
    ]
    out = ROOT / "theme/paper/gen/hoshitori.tex"
    out.parent.mkdir(exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
