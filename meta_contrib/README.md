# 経済学で高く評価される貢献とは何か：計量経済学の雑誌の格と「渋い問い」

- **問い**: 計量経済学の一流誌の論文は、二流・三流誌の論文と、どんな貢献の型・書き方で違うのか。「渋い問い」が評価されるのはなぜか。
- **トラック**: メタ研究（3トラックのどれにも当たらない。仮に推定量・手法として扱う。`DECISIONS.md` D15）
- **今の段階**: ③→④（候補27個から10個を選んだ。結果前論文と判定の質問を作る）
- **ロック**: 未ロック（`python3 tools/lock_pap.py meta_contrib --check`）
- **仮説の状態**: 検証するのは H01, H02, H03, H07, H11, H16, H18, H22, H23, H25（◆③、2026-11-24）。すべて未検証。他の17個は選外
- **次の一手**: 人が質問案（`questions/questions.toml`）を確かめ、OpenAlex の API キーを取る。AI が標本を取り（`code/01_fetch.py`→`02_split.py`）、判定のコードを書く
- **雑誌の格**: ABDC 2025 で定義（一流 A\* 9誌・二流 A 8誌・三流 B 6誌。`research/journal_tiers.csv`。2026-11-24 人が決定）
- **決めたこと（2026-11-24）**: 判定は OpenAI Decisions API（利用の許可あり）。雑誌の並びは `paper/main.tex` のデータ節の案

| 見るもの | 場所 |
|---|---|
| 正本 | `paper/main.tex`（PDF: `paper/main.pdf`） |
| 仮説 DB | `hypotheses/hypotheses.json` |
| 判定の質問（案） | `questions/questions.toml` |
| 正解づけの手順書（H23） | `research/labeling_protocol.md` |
| 雑誌の一覧と要旨の有無 | `code/00_journals.py` → `data/derived/journals_openalex.csv` |
| 着想のメモ | `../theme/research/contribution_types.md` |
| データの来歴と秘匿区分 | `data/README.md` |
| 走らせた推定の全記録 | `log/specs.csv` |
