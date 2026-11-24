# AGENTS.md — 研究のまとめ方（全プロジェクト共通）

研究成果は、すべて **LaTeX を正本** として書く。PDF とポータル（`portal/`）は、そこから自動で作る。
人もエージェントも、この手順に従う。プロジェクト固有の規約は `<project>/AGENTS.md` に書く。

## 0. まず README.md と ETHICS.md を読む

**研究の進め方の正本は `README.md`**（ポータルのトップページになる）。倫理規定は `ETHICS.md`。作業の前に必ず読む。要点は次のとおり。

- **8つの段階**: ①テーマ100→10 ②ディープダイブ ③仮説100→10 ④結果を見る前に論文を書いてロック ⑤文献をデータに ⑥シミュレーター ⑦推定と仕様の記録（⑤〜⑦は毎日回す）⑧監査・公開。
- **3つの原則**: すべてを正本1か所に書く／AI ネイティブに回す／人には軽く見せる。
- **3つのトラック**: 因果推論・実証（`causal`）／構造推定（`structural`）／推定量・計量手法（`method`）。
- **◆の判断（①②③④⑧）は人が行う。** エージェントは選択肢・根拠・推奨を `decision` 箱の下書きとして出し、代わりに決めない。ロック・コミット・外部への公開も、人の確認を取ってから行う。
- 自分の作業がどの段階・どの仮説（H番号）に関わるかを、出力に明記する。
- 進め方を変えたら、`README.md`・図（`common/figs/lab_figs.py`）・案内動画（`guide/video/videos/L01.js`）・この節を一緒に直す。

```
LaTeX・Markdown・CSV・JSON（正本） ──latexmk──▶ PDF
     │
     └──portal/build.py──▶ portal/dist（静的サイト。星取り表・研究ノート・仮説一覧・推定の記録・動画）
```

## 1. 置き場所

```
├── README.md                ラボの進め方（正本。ポータルのトップページ）
├── AGENTS.md                本ファイル
├── ETHICS.md                倫理規定
├── DECISIONS.md             人が決めたこと・まだ決めていないこと
├── common/lab_preamble.tex  共通プリアンブル（決まった箱）
├── common/figs/             README の図（lab_figs.py で描く）
├── common/video/            動画プレイヤーと規約（lib.js, player.js, STYLE.md）
├── guide/video/             ラボ案内の動画
├── tools/                   score_themes.py / litdb.py / verify_dois.py / lock_pap.py / check_video.sh / deploy_pages.py
├── portal/                  ポータルの生成器（build.py, tex2html.py, md2html.py, assets/）。dist/ は生成物
├── literature/              文献マスター表（papers.csv。唯一の正）と、統合前の出力（incoming/）
├── theme/                   段階1: 採点軸の解説（paper/）、採点表と重み（research/）、出典（common/refs.bib）
├── deepdive/                段階2: 1テーマ1文書
├── _template/               プロジェクトの雛形（コピーして使う。ポータルには出ない）
├── demo/                    動作見本（合成データだけを使う）
└── <project>/               1研究プロジェクト = 1ディレクトリ
    ├── README.md            入口。問い・トラック・今の段階・ロックの状態・次の一手
    ├── hypotheses/hypotheses.json   仮説 DB（書き方は hypotheses/README.md）
    ├── common/refs.bib      文献（マスター表から tools/litdb.py bib が作る。手で直さない）
    ├── paper/main.tex       正本（1本に積み上げる）。図は paper/figs/
    ├── prereg/LOCK.json     ロックの記録（lock_pap.py が書く）
    ├── data/README.md       データの来歴と秘匿区分
    ├── data/raw/            生データ（git に入れない。書き換えない）
    ├── data/sim/            合成データと点検結果
    ├── code/                分析コード（R が主）。00_run_all.R で端から端まで通る
    ├── sim/                 段階6のシミュレーション
    ├── log/specs.csv        走らせた推定の全記録
    ├── python/              公開するライブラリ（任意）
    ├── video/               動画（任意。index.html と videos/<ID>.js）
    └── research/            調査メモ・監査記録・抽出した推定値
```

- `<project>/README.md` があるディレクトリは、**自動でポータルに載る**。登録作業は要らない。
- 載せたくない下書きは、先頭が `_` のディレクトリに置く。

## 2. 新しいプロジェクトを始める

```sh
cp -r _template <project>
cd <project>/paper && latexmk -r latexmkrc main.tex
```

`main.tex` の章立ては次の順で固定する。節を足すのはよいが、順番は変えない。

| 節 | 書くこと | 使う箱 |
|---|---|---|
| 要旨・地図 | 問い／仮説／現状（支持・棄却・保留・未検証）／次の一手を3〜5文で | `abstract`, `chaptermap` |
| 背景と問い | 何が分かっていて何が分かっていないか。制度の説明 | `term` |
| 先行研究 | 転換点の論文5〜10本を表に。推定値と手法、何が未解決か | 表 |
| 研究仮説 | 反証可能な形。検証方法・データ・**数値の成功基準と棄却条件**・状態 | `hypothesis` |
| データ | 出所・単位・期間・n・秘匿区分・変数の定義（手法の研究ではシミュレーションの設定） | |
| 識別戦略と推定 | 推定式・モデル、仮定、反証テスト、推論（手法の研究では提案手法と比べる既存手法） | `design` |
| 予想される結果 | 表の枠、予想値（仮定と明記）、検出力 | |
| 結果 | 仮説ごとに追記。**古い結果は消さず日付で区別。確証／探索／合成データを明記** | `result` |
| 考察 | 別の説明を潰せているか。どこまで一般化できるか | `pitfall`, `debate` |
| 判断と次の一手 | Go／No-Go／ピボット、理由、誰がいつまでに何を | `decision` |
| 更新履歴 | 日付と変更点。ロック後の仕様変更は必ずここに | |

研究が進んだら、新しいファイルを作らずに **同じ main.tex に積み上げる**。

## 3. 書き方の規則

- **箱は決まったものだけ使う**: `abstract, chaptermap, keypoint, term, pitfall, debate, hypothesis, design, result, decision`。
  新しい箱が要るなら、`common/lab_preamble.tex`・`portal/tex2html.py`（`BOXES`）・`portal/assets/site.css` の3か所に足す。
- 事実には出典を付ける。**引用する文献は、まず文献マスター表（`literature/papers.csv`）に足す。** 書式と手順は `literature/README.md`。`python3 tools/litdb.py verify` で DOI を照合し、`python3 tools/litdb.py bib <project>` で `common/refs.bib` を作る。
- 読んだ深さ（本文／要旨／書誌のみ）を、マスター表の `read_depth` に正直に書く。書誌しか見ていない文献で、数値や断定を書かない。
- 推定値は、標準誤差か信頼区間・n・クラスタの単位・時点を付ける。有意性の星だけで語らない。
- 推測は「仮説」「筆者の見解」、予想値は「仮定」、合成データの結果は「合成データ」と明記する。
- である調。1文60字以内が目安。節タイトルは主張の形にする。
- 図は TikZ/pgfplots か、`code/` のスクリプトが出した PDF/PNG（`paper/figs/`）。図の元データの場所をキャプションに書く。意味を色だけで伝えない。
- ラベルは `fig:`, `tab:`, `sec:`, `eq:` に、文書内で一意な接頭辞を付ける。

### ウェブ版で崩れないための注意

ポータルは `portal/tex2html.py` で LaTeX を HTML にする。対応している書き方は次のとおり。それ以外は警告が出る。

| 種類 | 使えるもの |
|---|---|
| 節 | `\section` `\subsection` `\subsubsection`（`*` つきも可）、`\label` `\ref` |
| 文字 | `\textbf` `\emph` `\texttt` `\verb` `\url` `\href` `\footnote` |
| 引用 | `\parencite` `\cite` `\citep`（著者, 年）、`\textcite` `\citet` 著者（年）、`\printbibliography` |
| リスト | `itemize` `enumerate` `description` |
| 表 | `table` の中に `tabular` か `tabularx`。罫線は booktabs。`\multicolumn` 可 |
| 図 | `figure` の中に `\includegraphics` か `tikzpicture`。TikZ は PNG に描かれる |
| 数式 | `$..$` `\[..\]` `equation` `align` `gather`（ブラウザで MathJax が組む） |
| その他 | `\input{..}` |

- 独自マクロ（`\newcommand`）はウェブ版では展開されない。本文では使わない。
- 色指定はウェブでは消える。

## 4. 計量分析の規則（このラボ固有）

### 4.1 ロック（見る前に決める）

意味と手順は `README.md`「ロックとは何か」。エージェントが守ることは次のとおり。

- `python3 tools/lock_pap.py <project>` の実行は、人の承認を取ってから。
- **ロック前**: 実データの結果変数を読まない・集計しない・図にしない・推定しない。説明変数と標本の構成（n・欠損・処置の分布）は見てよい。コードは `data/sim/` の合成データで通す。
- **ロック後**: 仮説・推定の方法・標本の定義・主な結果変数・成功基準を変えたら、`main.tex` の更新履歴に日付と理由を書き、人の承認を得てもう一度ロックする。
- 結果を見てから思いついた分析は `stage = "exploratory"` として記録し、本文でも「探索」と書く。
- トラックごとに、ロックで固定するものが違う。構造推定ではモデルと推定に使うモーメント、手法の研究ではシミュレーションの設定・比べる既存手法・評価指標を固定する。

### 4.2 仕様の記録

- 推定はすべて `log_spec()`（R: `code/lib/speclog.R`、Python: `code/lib/speclog.py`）を通し、`log/specs.csv` に1行残す。行を消さない。
- `stage` は `synthetic`（合成データ）／`confirmatory`（ロックした仕様）／`exploratory`（結果を見た後）のどれか。
- 本文に載せる推定には `spec_id` を付ける。主な結果には仕様曲線を付ける。

### 4.3 識別と推論

- 仮説ごとに、推定対象（誰の、どの効果か。構造推定ではどのパラメータ・反実仮想か。手法では主張する性質）を1文で書く。
- 仮定を1つずつ書き、それぞれに「破れていたら何が観察されるか」と反証テストを対応させる（`design` 箱）。
- 標準誤差のクラスタ単位と、その理由を書く。仮説が複数あるときは、多重検定の扱いをロック前に決める。
- 検定を「通ったから安全」と書かない。検定の検出力と合わせて示す。
- ゼロに近い結果は「効果なし」と書かず、信頼区間で排除できた効果の大きさを書く。

### 4.4 データと再現性

- `data/raw/` は読むだけ。加工は `code/` で行い、結果は `data/derived/` に出す。
- データごとに、出所・取得日・版・利用条件・秘匿区分（T0/T1/T2）を `data/README.md` に書く。区分が無いデータは T2 として扱う（`ETHICS.md` 第4条）。
- `Rscript code/00_run_all.R` が、データから本文の全ての表・図までを作る。手作業の工程を挟まない。乱数の種は固定する。
- 言語は R を主にする。公開するライブラリと道具類は Python。同じ計算を両方で実装したら、同じ答えになることをテストで確かめる（例: `_template/python/tests/test_did.py`）。

### 4.5 監査（段階8、または人が頼んだとき）

- 書いたエージェントとは別のエージェントが、査読者として読む。観点は `_template/research/audit_template.md`。
- 指摘と対応を `research/audit-<日付>.md` に表で残す。直せなかった懸念も書く。

## 5. 動画

- 1本 = `<project>/video/videos/<ID>.js` 1ファイル。規約と構成の型は `common/video/STYLE.md`。
- 内容は正本（`main.tex`）にあるものだけ。数値を作らない。予想値を実測のように言わない。
- `tools/check_video.sh <project>/video` が通ること。

## 6. PDF とポータルを更新する

```sh
cd <project>/paper && latexmk -r latexmkrc main.tex   # PDF（エラー0・未定義引用0）
cd <project> && Rscript sim/mc_check.R                # 推定の手続きと検出力の点検
cd <project> && Rscript code/00_run_all.R             # 分析を端から端まで
python3 tools/litdb.py verify && python3 tools/litdb.py check   # 文献マスター表の照合と点検
python3 tools/litdb.py bib <project>                   # マスター表から common/refs.bib を作る
python3 tools/lock_pap.py <project> --check
python3 theme/paper/scripts/build.py                   # 星取り表（theme/paper の latexmk の前に）
python3 common/figs/lab_figs.py                        # README の図
python3 portal/build.py                                # ポータル（変換警告0を確認）
python3 -m http.server -d portal/dist 4321             # http://localhost:4321 で見る
python3 tools/deploy_pages.py                          # GitHub Pages に公開（人の確認を取ってから）
```

- npm からも呼べる（`package.json`。中身は上の Python コマンドを呼ぶだけで、依存パッケージは無い）。
  `npm start`（ポータルを作って http://localhost:4321 で開く）、`npm run build`、`npm run serve`、`npm run figs`、`npm run themes`、`npm run lit`、`npm run deploy`。

- `portal/build.py` は PDF を作らない。**先に latexmk で main.pdf を作る**。
- 必要なツール: TeX Live（lualatex, latexmk, biber）、Ghostscript（gs）、R、Python 3（標準ライブラリのみ）。
- 生成物（`portal/dist/`）は手で直さない。直すときは正本を直して作り直す。
- ポータルは GitHub Pages で公開している（`DECISIONS.md` D11）。`python3 tools/deploy_pages.py`（`npm run deploy`）が、公開版（`build.py --public`。git に入れていない文書を除く）を作って `gh-pages` ブランチに push する。誰でも見られるので、出す前に中身を確かめる。

## 7. エージェントへの依頼の型

「`<project>` を `_template` から作り、先行研究と仮説を書いて、PDF とポータルを更新して」と頼まれたら、次の順で進める。

1. `_template` をコピーする。`README.md`（1行目は `# 見出し`）に問い・トラック・現在の段階を書く。
2. 先行研究を調べる。文献マスター表に足し、`litdb.py verify`・`check`・`bib <project>` を通す。
3. `hypotheses.json` と、`main.tex` の背景・先行研究・仮説・データ・方法を書く。結果の節は「未検証」とし、空にしない。
4. `sim/mc_check.R` を実データの構造に合わせ、検出力を出して「予想される結果」に書く。
5. latexmk で PDF をビルドする。エラー0・未定義引用0を確認する。
6. `python3 portal/build.py` を実行する。変換警告が出たら直す。
7. ロック・コミット・公開は、人の確認を取ってから行う。
