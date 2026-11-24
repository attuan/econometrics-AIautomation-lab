# データの来歴と秘匿区分

`raw/` は読むだけ（git に入れない）。加工は `code/` で行い `derived/` に出す。`sim/` は合成データ。
区分の定義はリポジトリ直下の `README.md`「データの秘匿区分」。**区分が書かれていないデータは T2 として扱う。**

| 名前 | 置き場所 | 出所（URL・提供元） | 取得日・版 | 観測単位・期間・n | 利用条件（規約・申請・再配布の可否） | 区分 | 結果変数を含むか |
|---|---|---|---|---|---|---|---|
| 論文の書誌・題目・要旨（予定） | `raw/openalex/` | OpenAlex API（https://openalex.org） | 未取得 | 論文。2015〜2024年。23誌×最大300本 | 書誌は CC0。要旨の本文は出版社に権利がある可能性があるので、再配布しない（git に入れない） | T0 | 含む（掲載誌＝格） |
| 雑誌の格付け表 | `../research/journal_tiers.csv` | ABDC Journal Quality List 2025（https://abdc.edu.au/abdc-journal-quality-list/） | 2026-11-24 取得 | 雑誌（23誌） | 公開されている格を雑誌ごとに写した。元のファイルは再配布しない | T0 | 含む（格） |
| 決定モデルの判定（予定） | `derived/predicates.csv` | OpenAI Decisions API に題目と要旨を渡して得る P(はい) | 未取得 | 論文×質問 | モデルの規約に従う | T0 | 含まない（雑誌名は渡さない） |

## 結果変数とロック

この研究の結果変数は、掲載誌の格（一流・二流・三流）である。雑誌名は書誌に必ず付いてくるので、「結果を見ない」を次のように作る。

- 標本を、雑誌ごとに層を切って無作為に **探索用30%・確証用70%** に分ける（乱数の種は固定し、分けた結果を記録する）。
- ロック前に、格と特徴量を突き合わせてよいのは探索用だけである。探索用で質問と仮説を直し、ロックしてから確証用で検定する。
- 決定モデルには雑誌名を渡さない。

## 取得手順

1. `python3 code/00_journals.py`: 候補の雑誌を OpenAlex の source に対応づけ、年ごとの論文数と要旨のある論文数を `derived/journals_openalex.csv` に出す（格との突き合わせはしない）。名前の検索で誤る2誌（Econometrics Journal、MDPI の Econometrics）は ISSN で引いた ID に固定した。
2. `python3 code/01_fetch.py`（キーはリポジトリ直下の `.env` から読む。雛形は `.env.example`）: OpenAlex から題目と要旨を取る。要旨が無い論文は Semantic Scholar の API で DOI から補う。出力は `raw/works.jsonl` と `derived/coverage.csv`。
   OpenAlex はキー無しだと IP 単位の共有の無料枠（1日 $0.10 相当）しか使えず、2026-11-24 の初回実行は 401 で止まった。無料のキー（1日 $1 相当）は https://openalex.org/settings/api で、本人のメールアドレスで取る。キーは git に入れない。
3. `python3 code/02_split.py`: 要旨が50語以上の論文から雑誌ごとに最大300本を取り、雑誌ごとに探索用30%・確証用70%に分ける。探索用から人の正解づけ用に80本（無作為60本＋語で選ぶ20本）を選ぶ（正解づけの表には雑誌名・年・著者を出さない。手順は `research/labeling_protocol.md`）。乱数の種は 20261124。

### 雑誌の格の定義（2026-11-24 に照合）

`research/journal_tiers.csv` に、仮の格（tier_draft）と ABDC Journal Quality List 2025 の格を並べた。出所は ABDC の公開ファイル（https://abdc.edu.au/abdc-journal-quality-list/ の xlsx、2026-11-24 取得）。
仮の格と ABDC は大きく食い違う。ABDC では仮の二流のうち3誌（JAE、Econometrics Journal、J. Financial Econometrics）が A\*、仮の三流のうち4誌（Empirical Economics、Applied Economics、J. Forecasting、SNDE）が A で、B は MDPI の Econometrics だけである。
**決定（2026-11-24、人の判断）**: 格は ABDC 2025 で定義する。一流 = A\*（9誌）、二流 = A（8誌）、三流 = B（6誌。MDPI の Econometrics に、Econometrics and Statistics、J. Econometric Methods、J. Time Series Econometrics、J. Quantitative Economics、Applied Economics Letters を足した）。仮の3段階（tier_draft）は感度分析に回す。AJG（ABS）は登録が要るので照合していない。

### 要旨の欠け（2026-11-24 に確認）

OpenAlex では、Elsevier と Springer の一部の雑誌で要旨が大きく欠ける（2015〜2024年の論文のうち要旨がある割合: Journal of Econometrics 15%、International Journal of Forecasting 17%、Empirical Economics 19%）。欠け方は年で偏り、近年ほど多く残る。
要旨の有無が論文の性質（例: オープンアクセスか）と関係すると、標本が偏る。Semantic Scholar で補うと、Journal of Econometrics の2018年の欠けた8本のうち5本が埋まった（試しの照会）。
補った後も残る欠けの割合を雑誌×年で記録し、感度分析（欠けの少ない雑誌・年に限る）を置く。

**補完の結果（2026-11-24、`code/01b_fill_gaps.py`）**: Semantic Scholar（回数制限で取りこぼした分の取り直し）と、RePEc の IDEAS の論文ページ（題目で照合。1秒に1回）で補った。要旨の出所は OpenAlex 16,383本、Semantic Scholar 1,841本、RePEc 2,335本。
研究論文でないもの（年報・投稿規定・表紙など269本）を題目で除くと、研究論文の要旨の網羅率は全雑誌で81%以上になった。低い順に Econometrics and Statistics 81%、Empirical Economics 88%、Econometrica 90%、J. Quantitative Economics 91%、J. Financial Econometrics 91%。Econometrica は IDEAS の一覧を読めず（一覧0件）、補えていない。
RePEc の一括ファイル（ftp.repec.org）は TLS 証明書が合わないため使っていない。

**標本（2026-11-24、`code/02_split.py`）**: 6,348本（探索用 1,905本、確証用 4,443本）。23誌のうち20誌は上限の300本、Econometrics Journal 236本、J. Financial Econometrics 265本、J. Econometric Methods 79本、J. Time Series Econometrics 68本。正解づけ用は探索用から80本（無作為60本、語で選んだ20本）。

## 倫理審査・利用申請の記録

人を対象としないので、倫理審査は不要の見込み（所属機関の規程は未確認）。
