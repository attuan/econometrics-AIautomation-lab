# labtool（仮の名前）

論文と一緒に公開する Python ライブラリの雛形。ソフトウェア論文の査読基準（必要性の説明・導入手順・使用例・文書・テスト）に沿って、次の節を埋める。

## 何のためのものか（必要性）

誰が、どんな分析で、いま何に困っていて、このライブラリが何を楽にするか。既存のライブラリとの違い。

## 導入

```sh
pip install -e python/
```

## 使い方

```python
from labtool import did_unit
est = did_unit(rows)   # rows: unit, treated, post, y を持つ辞書のリスト
print(est.estimate, est.se)
```

## 正しく動く条件・誤る条件

どの仮定のもとで正しいか。どんなデータで使ってはいけないか。根拠（`sim/` のシミュレーション結果）への参照。

## テスト

```sh
cd python && python3 -m unittest discover -s tests
```

R の実装（`code/lib/speclog.R` の `did_unit`）と同じ答えになることを、同じデータで確かめる。

## ライセンス・引用

未定（公開の前に人が決める）。対応する論文の書誌をここに書く。
