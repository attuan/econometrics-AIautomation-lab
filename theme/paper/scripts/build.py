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
    TOP = 20                                   # 文書には上位だけ載せる。全件は themes.csv とポータルにある
    for r in rows[:TOP]:
        g = " & ".join(f"{r[f'g{i}']:.0f}" for i in range(1, len(groups) + 1))
        lines.append(f"{r['pos']} & {TRACK.get(r['track'], r['track'])} & {r['id']} {r['theme']} & {g} & {r['total']} \\\\")
    n_pilot = sum(r.get("status") == "pilot" for r in rows)
    n_cap = sum(bool(r["capped"]) for r in rows)
    lines += [
        r"\bottomrule", r"\end{tabularx}",
        rf"\caption{{星取り表（合計点の順。{len(rows)}件のうち上位{min(TOP, len(rows))}件）。群の点は20〜100、合計は4群の点の幾何平均。{n_pilot}件が試行採点（出典未調査）、"
        rf"{n_cap}件は根拠の欄が空で、新規性かデータ入手性を上限2点で計算した。"
        r"データは \texttt{theme/research/themes.csv}。}",
        r"\label{tab:th-hoshi}", r"\end{table}", "",
    ]
    out = ROOT / "theme/paper/gen/hoshitori.tex"
    out.parent.mkdir(exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(out)
    top10(rows, groups)


def top10(rows, groups):
    """theme/research/recommended.csv（AI の推奨。選ぶのは人）から、上位10個の表を2枚作る。"""
    import csv
    src = ROOT / "theme/research/recommended.csv"
    if not src.exists():
        return
    by = {r["id"]: r for r in rows}
    rec = [r for r in csv.DictReader(open(src, newline="", encoding="utf-8")) if r["id"] in by]
    a = [r"\begin{table}[htbp]", r"\centering\small",
         r"\begin{tabularx}{\linewidth}{rlX" + "r" * (len(groups) + 1) + "}", r"\toprule",
         "順 & 型 & テーマ & " + " & ".join(groups) + r" & 合計 \\", r"\midrule"]
    b = [r"\begin{table}[htbp]", r"\centering\small", r"\begin{tabularx}{\linewidth}{lXX}", r"\toprule",
         r"テーマ & 推す理由 & いちばんの弱点・未確認の点 \\", r"\midrule"]
    for c in rec:
        r = by[c["id"]]
        g = " & ".join(f"{r[f'g{i}']:.0f}" for i in range(1, len(groups) + 1))
        merged = f"（{c['merged']} を統合）" if c["merged"] else ""
        a.append(f"{r['pos']} & {TRACK.get(r['track'], r['track'])} & {r['id']} {r['theme']}{merged} & {g} & {r['total']} \\\\")
        b.append(f"{r['id']} & {c['why']} & {c['weak']} \\\\")
    a += [r"\bottomrule", r"\end{tabularx}",
          r"\caption{上位10個の案（AI の推奨）。順は100件の中での合計点の順位。データは \texttt{theme/research/recommended.csv} と \texttt{scored.csv}。}",
          r"\label{tab:th-top10}", r"\end{table}", ""]
    b += [r"\bottomrule", r"\end{tabularx}",
          r"\caption{上位10個の案の根拠と弱点。近い既存研究・データ・競合の出典は \texttt{theme/research/themes.csv} の各欄にある。}",
          r"\label{tab:th-top10why}", r"\end{table}", ""]
    out = ROOT / "theme/paper/gen/top10.tex"
    out.write_text("\n".join(a + b), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
