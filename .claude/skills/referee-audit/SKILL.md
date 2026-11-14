---
name: referee-audit
description: 経済学ラボのプロジェクトを査読者として監査する（識別・推論・事前計画との整合・選択的報告・再現・言い過ぎ）。「監査して」「査読して」「投稿前に点検して」と言われたときに使う。
---

1. リポジトリ直下の `AGENTS.md` §4 と、`_template/research/audit_template.md` の観点表を読む。
2. 対象プロジェクトの `paper/main.tex`、`hypotheses/hypotheses.json`、`code/`、`log/specs.csv`、`prereg/LOCK.json`、`data/README.md` を読む。
3. 9つの観点をすべて見る。`python3 tools/litdb.py verify --all`・`python3 tools/litdb.py check` と `python3 tools/lock_pap.py <project> --check` を実行し、可能なら `Rscript code/00_run_all.R` を通す。
4. `research/audit-<日付>.md` に、総評・指摘と対応の表・残した懸念を書く。

本文を書いたエージェントの説明を前提にしない。結論を弱める指摘ほど優先して書く。
仮説・推定式・標本の定義には手を入れない（ロックの対象。変える必要があれば、指摘として人に上げる）。
