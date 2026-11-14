---
name: lab-note
description: 経済学ラボの研究ノート（研究仮説・識別戦略・先行研究・推定結果・Go/No-Go）を LaTeX 正本で作成・更新し、PDF とポータルに反映する。「研究ノートを作って」「仮説をまとめて」「推定結果を追記して」「プロジェクトを始めて」「ポータルを更新して」と言われたときに使う。
---

リポジトリ直下の `README.md`・`AGENTS.md`・`ETHICS.md` を読み、`AGENTS.md` §7「エージェントへの依頼の型」の手順に従う。
プロジェクト固有の規約（`<project>/AGENTS.md`）があれば、それも先に読む。

作業の前に必ず `python3 tools/lock_pap.py <project> --check` を実行する。
未ロックなら実データの結果変数に触れず、合成データ（`data/sim/`）で進める。
文献を引用するときは、先に文献マスター表（`literature/papers.csv`、書式は `literature/README.md`）に足し、`python3 tools/litdb.py verify`・`check`・`bib <project>` を通す。`common/refs.bib` は手で直さない。
書き終えたら `python3 portal/build.py` でポータルを作り直し、変換警告が0件であることを確かめる。
ロック（`tools/lock_pap.py <project>`）、コミット、外部への公開は、必ず人間の確認を取ってから行う。
