#!/usr/bin/env python3
"""README の図1（研究の流れ）を SVG で描く。python3 common/figs/lab_figs.py

段階を変えたら、ここと README.md・AGENTS.md §0 を一緒に直す。標準ライブラリだけで動く。
"""
from pathlib import Path

STAGES = [  # (番号, 名前, AI がやること, 人の関門か)
    ("1", "テーマを100個出し、10個に絞る", "15軸で採点・ブラインド再採点・星取り表", True),
    ("2", "10テーマをディープダイブする", "文献の地図・データの入手手順・識別の手がかり", True),
    ("3", "仮説を100個作り、10個選ぶ", "検証方法・必要なデータ・数値の棄却条件", True),
    ("4", "結果を見る前に、論文として書く", "表の枠・予想値・Go/No-Go → 承認してロック", True),
    ("5", "文献をデータにする", "推定値・標準誤差・識別戦略を表に", False),
    ("6", "シミュレーターを作り込む", "合成データで推定の手続きと検出力を点検", False),
    ("7", "推定し、すべての仕様を記録する", "確証と探索を分ける・仕様曲線", False),
    ("8", "実証し、公開する", "査読者役の監査・再現パッケージ・論文・ライブラリ", True),
]
W, BOX_W, BOX_H, GAP, X0, Y0 = 760, 560, 52, 16, 60, 56
INK, MUTED, LINE, GATE, LOOP, BG = "#1c2430", "#5a6270", "#9aa3af", "#c8641e", "#6a4c9c", "#ffffff"


def flow():
    h = Y0 + len(STAGES) * (BOX_H + GAP) + 44
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" font-family="\'Hiragino Sans\',\'Noto Sans JP\',sans-serif">',
         f'<rect width="{W}" height="{h}" fill="{BG}"/>',
         f'<text x="{X0}" y="30" font-size="16" font-weight="700" fill="{INK}">研究の流れ（上から順に進む）</text>']
    ys = []
    for i, (num, name, ai, gate) in enumerate(STAGES):
        y = Y0 + i * (BOX_H + GAP)
        ys.append(y)
        stroke = GATE if gate else LINE
        o.append(f'<rect x="{X0}" y="{y}" width="{BOX_W}" height="{BOX_H}" rx="6" fill="{BG}" stroke="{stroke}" stroke-width="{2 if gate else 1.2}"/>')
        o.append(f'<text x="{X0 + 16}" y="{y + 22}" font-size="14" font-weight="700" fill="{INK}">{num}. {name}</text>')
        o.append(f'<text x="{X0 + 16}" y="{y + 41}" font-size="11.5" fill="{MUTED}">{ai}</text>')
        if gate:
            o.append(f'<text x="{X0 + BOX_W - 14}" y="{y + 31}" font-size="12" font-weight="700" fill="{GATE}" text-anchor="end">◆ 人が判断</text>')
        if i:
            cx = X0 + BOX_W / 2
            o.append(f'<path d="M{cx} {y - GAP} V{y - 3} m-4 -5 l4 5 l4 -5" fill="none" stroke="{LINE}" stroke-width="1.4"/>')
    # 5〜7 のループ
    top, bot, lx = ys[4] + BOX_H / 2, ys[6] + BOX_H / 2, X0 + BOX_W + 34
    o.append(f'<path d="M{X0 + BOX_W} {bot} H{lx} V{top} H{X0 + BOX_W + 4} m5 -4 l-5 4 l5 4" fill="none" stroke="{LOOP}" stroke-width="1.6"/>')
    o.append(f'<text x="{lx + 10}" y="{(top + bot) / 2 - 4}" font-size="12" font-weight="700" fill="{LOOP}">毎日回す</text>')
    o.append(f'<text x="{lx + 10}" y="{(top + bot) / 2 + 13}" font-size="11" fill="{MUTED}">5 → 6 → 7</text>')
    # ロックの線（4 と 5 の間）
    ly = ys[4] - GAP / 2
    o.append(f'<path d="M{X0 - 30} {ly} H{X0 + BOX_W + 30}" stroke="{GATE}" stroke-width="1.2" stroke-dasharray="5 4"/>')
    o.append(f'<text x="{X0 + BOX_W + 36}" y="{ly + 4}" font-size="11" fill="{GATE}">ロック</text>')
    o.append(f'<text x="{X0}" y="{h - 16}" font-size="11" fill="{MUTED}">破線より上では実データの結果変数を見ない。5・6 は結果変数を使わないので、ロック前から回してよい。</text>')
    o.append("</svg>")
    out = Path(__file__).with_name("lab_flow.svg")
    out.write_text("\n".join(o) + "\n", encoding="utf-8")
    print(out)


def principles():
    """図2: 左の情報 → 正本 → 右の見せ方。"""
    w, h = 760, 330
    left = ["論文・ワーキングペーパー", "データの来歴と利用条件", "識別・推定の議論", "走らせた推定の全記録", "判断と、棄却した仮説"]
    right = ["PDF（論文の形）", "ポータル（星取り表・仮説一覧）", "動画（図と字幕で3〜8分）", "再現パッケージ・ライブラリ"]
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="\'Hiragino Sans\',\'Noto Sans JP\',sans-serif">',
         f'<rect width="{w}" height="{h}" fill="{BG}"/>']
    heads = [(20, "① すべてを1か所に", INK), (288, "② AI ネイティブに回す", LOOP), (530, "③ 人には軽く見せる", GATE)]
    for x, t, c in heads:
        o.append(f'<text x="{x}" y="28" font-size="14" font-weight="700" fill="{c}">{t}</text>')
    for i, t in enumerate(left):
        y = 48 + i * 50
        o.append(f'<rect x="20" y="{y}" width="210" height="38" rx="6" fill="{BG}" stroke="{LINE}" stroke-width="1.2"/>')
        o.append(f'<text x="32" y="{y + 24}" font-size="12.5" fill="{INK}">{t}</text>')
        o.append(f'<path d="M230 {y + 19} L284 {150 + (i - 2) * 9}" stroke="{LINE}" stroke-width="1.3" fill="none"/>')
    o.append(f'<rect x="288" y="92" width="190" height="130" rx="10" fill="{BG}" stroke="{LOOP}" stroke-width="2"/>')
    o.append(f'<text x="383" y="128" font-size="17" font-weight="700" fill="{INK}" text-anchor="middle">正本</text>')
    o.append(f'<text x="383" y="152" font-size="12" fill="{MUTED}" text-anchor="middle">LaTeX・CSV・JSON・コード</text>')
    o.append(f'<text x="383" y="184" font-size="12.5" fill="{LOOP}" text-anchor="middle" font-weight="700">AI エージェントが読み書き</text>')
    o.append(f'<text x="383" y="204" font-size="12" fill="{MUTED}" text-anchor="middle">◆の判断は人</text>')
    for i, t in enumerate(right):
        y = 60 + i * 56
        o.append(f'<path d="M478 {150 + (i - 1.5) * 12} L526 {y + 20} m-9 -1 l9 1 l-5 7" stroke="{LINE}" stroke-width="1.3" fill="none"/>')
        o.append(f'<rect x="530" y="{y}" width="210" height="40" rx="6" fill="{BG}" stroke="{GATE}" stroke-width="1.4"/>')
        o.append(f'<text x="542" y="{y + 25}" font-size="12.5" fill="{INK}">{t}</text>')
    o.append(f'<text x="20" y="{h - 14}" font-size="11" fill="{MUTED}">右の4つは正本から自動で作る。手で直さない。直すときは正本を直して作り直す。</text>')
    o.append("</svg>")
    out = Path(__file__).with_name("lab_principles.svg")
    out.write_text("\n".join(o) + "\n", encoding="utf-8")
    print(out)


def main():
    flow()
    principles()


if __name__ == "__main__":
    main()
