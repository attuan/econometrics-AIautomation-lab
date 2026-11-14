# 文献マスター表

ラボ全体で1つの表 `papers.csv` に、読んだ文献を1行1件で持つ。**これが文献の唯一の正である。**
各プロジェクトの `common/refs.bib` は、この表から自動で作る。手で直さない。
論文の本体（PDF）は保存しない。持つのは書誌・要点・読んだ深さである。

## 3行で言うと

1. 文献を引用する前に、まずこの表に足す。
2. DOI は照合し、読んだ深さ（本文・要旨・書誌だけ）を正直に書く。書誌しか見ていない文献に数値を書かない。
3. `python3 tools/litdb.py bib <project>` で、そのプロジェクトが引用している分だけの文献ファイルを作る。

## 手順

```sh
python3 tools/litdb.py merge              # literature/incoming/*.csv を統合（DOI・URL の重複は除く）
python3 tools/litdb.py verify             # DOI を Crossref で照合（題名と年）
python3 tools/litdb.py check              # 書式と約束の点検。誤り0件にする
python3 tools/litdb.py pdf                # 公開されている PDF の場所を探す（ポータルの PDF リンク）
python3 tools/litdb.py bib theme demo     # 各プロジェクトの common/refs.bib を作り直す
python3 tools/litdb.py stats              # 件数の内訳
```

`bib` は、本文の `\cite` にあるキーがこの表に無いとき、または DOI が未照合のとき、誤りを出して止まる。

### 大量に集めるとき（段階1・2・5）

1. 分野やカテゴリーごとにエージェントを並べて走らせる。各エージェントは `incoming/<名前>.csv`（この表と同じ列）と、所見のメモ `incoming/<名前>_notes.md` を書く。
2. `merge` で統合する。既にある DOI・URL は除かれ、id がぶつかれば `a`, `b` が付く。
3. `verify` と `check` を通す。
4. `incoming/` のファイルは消さない（どのエージェントが何を出したかの記録になる）。

## どこから取ってくるか

| 取得元 | 何に使う | 注意 |
|---|---|---|
| ウェブ検索、既知の総説・展望論文の文献表 | 候補を拾う | 拾った書誌は必ず照合する |
| Crossref API | DOI から題名・年を引いて照合する | 照合できない DOI は書かない |
| ワーキングペーパーの公開先（NBER、SSRN、arXiv、IZA、RePEc、著者のサイト） | 本文を読む | 版によって数値が違う。読んだ版の URL と閲覧日を書く |
| 学術誌の公開版 | 本文を読む | 読めなければ `read_depth` は `abstract` か `biblio` |

経済学では、査読誌の論文にもワーキングペーパー版が公開されていることが多い。本文を読めたら `fulltext_url` に読んだ版の URL を書く。

## PDF へのリンク

`litdb.py pdf` は、PDF を保存せず、公開されている場所の URL だけを `pdf_url` に書く。

- arXiv の論文は、URL から PDF の場所を作る。
- DOI つきの論文は、OpenAlex が「公開版」と記録している場所だけを使う（著者や機関のリポジトリ、出版社の公開版）。送るのは DOI だけである。
- 公開版が見つからない論文は空のままにする。ポータルでは DOI のリンクだけになる。有料の本文を回避する場所は使わない。
- 見つかる版は、ワーキングペーパー版のことがある。掲載版と数値が違うことがあるので、数値を写すときは読んだ版を `fulltext_url` に書く。

## 列

| 列 | 内容 | 例 |
|---|---|---|
| id | 第一著者の姓（英小文字）+年。文献ファイルのキーになる | `angrist2010` |
| importance | 1〜5（5=分野を作った研究、4=転換点、3=重要な手法・知見、2=参考、1=周辺）。推測で5を付けない | 5 |
| year | 出版年（ワーキングペーパーは公開年） | 2010 |
| track | `causal` / `structural` / `method` / `meta`（研究の進め方・評価・再現性） | `causal` |
| field | JEL 分類（`;` 区切り） | `J31;C23` |
| tags | 補助の札（`;` 区切り） | `最低賃金;県境` |
| type | `article`（査読誌）/ `wp`（ワーキングペーパー・プレプリント）/ `online`（ウェブページ）/ `book` | `article` |
| title | 原題 | |
| authors | `姓, 名 and 姓, 名`。組織は `{組織名}` | `Angrist, Joshua D. and Pischke, J{\"o}rn-Steffen` |
| venue | 掲載誌。`wp`・`online` ではシリーズ名や補足 | `Journal of Economic Perspectives` |
| volume, number, pages | 巻・号・頁 | `24`, `2`, `3--30` |
| doi | DOI。`https://doi.org/` を付けない | `10.1257/jep.24.2.3` |
| url, urldate | URL と閲覧日。`wp`・`online` では必須 | |
| design | 識別戦略・手法・モデルの種類 | `県境の差の差` |
| data | 国・期間・データ名・観測単位・n | `米国、1990–2006、郡の組` |
| key_finding | 主な結果。推定値は標準誤差か区間と一緒に写す | |
| significance | なぜ重要か。このラボのどこで使うか | |
| read_depth | `full`（本文まで読んだ）/ `abstract`（要旨まで）/ `biblio`（書誌だけ） | `abstract` |
| fulltext_url | 本文を読んだ版の URL | |
| pdf_url | 公開されている PDF の場所。`litdb.py pdf` が探して書く。ポータルの「PDF」リンクになる | |
| themes | 関係するテーマの ID（`;` 区切り） | `T001;T004` |
| projects | 引用しているプロジェクト（`;` 区切り） | `theme` |
| added, added_by | 足した日と、足した人・エージェント | `2026-11-14`, `AI` |
| doi_ok, doi_checked | 照合の結果（`yes`/`no`）と日付。`verify` が書く | |
| checked_by_human | 人が原文で要点を確かめたら、名前と日付 | |
| note | 補足（査読前、版の違いなど） | |

## 約束

- **書誌しか見ていない文献（`biblio`）の `key_finding` に、数値を書かない。** `check` が誤りにする。要点は「未確認の要約」として扱う。
- 数値を写したら、表番号か頁を `note` に書く。
- AI の要約は、人が原文で確かめるまで未確認である。確かめたら `checked_by_human` に書く。
- `importance` が4以上の文献は、少なくとも要旨まで読む。
- 行を消さない。誤りと分かった文献は、`note` に理由を書いて残す（同じ誤りを繰り返さないため）。

## プロジェクトごとの表との関係

- この表: 文献1件につき1行。要点は文章。
- `<project>/research/estimates.csv`: 推定値1つにつき1行（1本の論文から何行も出る）。`bibkey` 列がこの表の `id` に当たる。メタ分析と検出力の見積もりに使う。
- `theme/research/themes.csv` の `nearest` 列: いちばん近い既存研究3本を、この表の `id` で書く。
