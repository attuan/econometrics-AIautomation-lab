# 仮説 DB の書き方

`hypotheses.json` は仮説の配列。段階3で100個作り、10個を選んで `paper/main.tex` の `hypothesis` 箱に書く。ポータルの「研究仮説」ページになる。

- `track`: `causal`（因果推論・実証）/ `structural`（構造推定）/ `method`（推定量・計量手法）
- `type`: `extension`（既存研究の延長）/ `edge`（尖った問い）/ `combination`（既存要素の組合せ）/ `cross-field`（異分野の手法・データの転用）/ `replication`（追試と拡張）
- `status`: `untested` / `supported` / `rejected` / `inconclusive` / `dropped`。落とした仮説も消さず、理由を `note` に書く。
- `priority`: 5=すぐ着手（公開データや合成データだけで検証できる、または効果が大きい）… 1=長期的
- `success_metric` と `rejection` は数値で書く。数値の棄却条件がないものは仮説として扱わない。
