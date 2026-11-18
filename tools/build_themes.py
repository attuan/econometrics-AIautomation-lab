#!/usr/bin/env python3
"""エージェントが書いたテーマの一次出力から、採点表 theme/research/themes.csv を作る。

    python3 tools/build_themes.py theme/research/incoming/<名前>_themes.tsv theme/research/incoming/<名前>_data.tsv

入力1（テーマ、タブ区切り）: id, track, design, cluster, theme, scores（15軸の点を軸の順に並べた15桁）, K, data（データの記号）,
                              first_project, risks, win_thesis, nearest（`文献id:差;文献id:差;文献id:差`）,
                              rationale（任意。ブラインド再採点との突き合わせの記録）, competitors（任意。競合を調べた記録）
入力2（データ、タブ区切り）: code, name, url, tier, synthetic, note, verified（人やエージェントがページの中身まで確かめたときの記録）

根拠の欄は、確かめられたものだけを書く。
- nearest: 3本すべてが文献マスター表にあり、DOI が照合済み（DOI の無い文献は URL つき）のときだけ書く。
- data_check: 合成データで足りるか、データの URL が応答したときだけ書く。必要な変数の有無までは見ていない、と明記する。
どちらも空なら、採点（tools/score_themes.py）で上限2点になる。
"""
import csv
import datetime
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import litdb  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TODAY = datetime.date.today().isoformat()
COLS = ["id", "track", "design", "cluster", "theme", "Q", "N", "R", "T", "I", "W", "E", "D", "X", "L", "F", "C", "U", "O", "S", "K",
        "status", "nearest", "data_check", "field", "design_type", "data_sources", "competitors", "lit_trend", "first_project",
        "risks", "sources", "rationale", "win_thesis"]


def responds(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status < 400
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    tsv = lambda p: list(csv.DictReader(open(p, newline="", encoding="utf-8"), delimiter="\t"))
    themes, data = tsv(sys.argv[1]), {r["code"]: r for r in tsv(sys.argv[2])}
    axes = [r["axis"] for r in csv.DictReader(open(ROOT / "theme/research/axes.csv", newline="", encoding="utf-8"))]
    master = {r["id"]: r for r in litdb.read()}
    ok_paper = lambda k: k in master and (master[k]["doi_ok"] == "yes" or (not master[k]["doi"] and master[k]["url"]))

    checks = {}
    for code, d in data.items():
        if d["synthetic"] == "yes":
            checks[code] = f"{d['name']}。{d['note']}"
        elif d.get("verified"):
            checks[code] = f"{d['name']}（{d['url']}、区分 {d['tier']}）。{d['verified']}。"
        elif responds(d["url"]):
            checks[code] = f"{d['name']}（{d['url']}、{TODAY} に応答を確認、区分 {d['tier']}）。必要な変数の有無は未確認。{d['note']}".rstrip("。") + "。"
        else:
            checks[code] = ""
            print(f"  データの URL が応答しない: {code} {d['url']}（data_check を空にする）")

    out, n_near, n_data = [], 0, 0
    for t in themes:
        row = {c: "" for c in COLS}
        row.update({k: t[k] for k in ("id", "track", "design", "cluster", "theme", "K", "first_project", "risks", "win_thesis")})
        row.update(dict(zip(axes, t["scores"])))
        pairs = [x.split(":", 1) for x in t["nearest"].split(";")]
        missing = [k for k, _ in pairs if not ok_paper(k)]
        if len(pairs) >= 3 and not missing:
            row["nearest"] = " / ".join(f"{k}: {d}" for k, d in pairs)
            row["sources"] = ";".join(f"https://doi.org/{master[k]['doi']}" if master[k]["doi"] else master[k]["url"] for k, _ in pairs)
            n_near += 1
        else:
            print(f"  {t['id']}: 近い既存研究のうち照合できなかったもの {missing}（nearest を空にする）")
        d = data[t["data"]]
        row["data_check"] = checks[t["data"]]
        n_data += bool(row["data_check"])
        row["data_sources"] = f"{d['name']}（{d['tier']}）"
        row["design_type"] = t["design"]
        row["status"] = "screened"
        row["competitors"] = t.get("competitors") or "近い既存研究の欄を参照。進行中の研究は未調査"
        row["lit_trend"] = "未調査"
        row["rationale"] = t.get("rationale", "")      # ブラインド再採点との突き合わせ（あれば）
        out.append(row)
        for k, _ in pairs:                      # マスター表に、どのテーマの近い研究かを書き戻す
            if k in master:
                ts = set(filter(None, master[k]["themes"].split(";"))) | {t["id"]}
                master[k]["themes"] = ";".join(sorted(ts))
    with open(ROOT / "theme/research/themes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        w.writerows(out)
    litdb.write(list(master.values()))
    print(f"{len(out)} テーマを書いた。近い既存研究3本が照合済み {n_near} 件、データの所在を確認 {n_data} 件。")


if __name__ == "__main__":
    main()
