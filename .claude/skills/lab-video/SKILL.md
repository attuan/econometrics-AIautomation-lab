---
name: lab-video
description: 経済学ラボの解説動画（ブラウザで動く SVG アニメーションと字幕）を作成・更新する。「動画を作って」「動画にして」「ビデオを更新して」と言われたときに使う。
---

1. `common/video/STYLE.md`（構成の型・認知負荷を下げる規約・色の意味）を読む。
2. 内容の正本（`<project>/paper/main.tex` など）を読む。数値は正本にあるものだけ使う。予想値・合成データ・未検証の区別を、画面と字幕で守る。
3. `_template/video/` を写して `<project>/video/videos/<ID>.js` を書く。`common/video/` の lib.js・player.js・style.css は編集しない。
4. `tools/check_video.sh <project>/video` が問題0件で通ることを確かめる。`--shots <出力先>` で場面を書き出し、文字の重なりやはみ出しを目で見る。
5. `python3 portal/build.py` でポータルに反映する。
