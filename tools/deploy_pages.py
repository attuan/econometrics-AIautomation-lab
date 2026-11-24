#!/usr/bin/env python3
"""ポータルを GitHub Pages（gh-pages ブランチ）に出す。

    python3 tools/deploy_pages.py          # 公開版をビルドして gh-pages に push
    python3 tools/deploy_pages.py --dry-run  # ビルドとコミットまで。push しない

手順: ① portal/build.py --public（変換警告があれば止める）
      ② portal/dist を一時ディレクトリにコピーし、1コミットだけの gh-pages を作る
      ③ origin の gh-pages に強制 push（履歴は持たない。正本は main にある）
公開してよいかは人が決める（DECISIONS.md D11）。PDF・TikZ 図は先に手元で作っておく。
Python の標準ライブラリと git だけで動く。
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "portal/dist"
BRANCH = "gh-pages"


def run(cmd, cwd=ROOT, capture=False):
    r = subprocess.run(cmd, cwd=cwd, text=True, capture_output=capture)
    if r.returncode != 0:
        sys.exit(f"失敗: {' '.join(cmd)}\n{r.stderr or ''}")
    return (r.stdout or "").strip()


def main():
    dry = "--dry-run" in sys.argv
    if run(["git", "status", "--porcelain"], capture=True):
        print("注意: 作業ツリーにコミットしていない変更がある。公開版にはそれも入る。")
    run([sys.executable, "portal/build.py", "--public"])
    remote = run(["git", "remote", "get-url", "origin"], capture=True)
    head = run(["git", "rev-parse", "--short", "HEAD"], capture=True)
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "site"
        shutil.copytree(DIST, site)
        (site / ".nojekyll").write_text("")  # _ で始まるファイルも配信させる
        run(["git", "init", "-q", "-b", BRANCH], cwd=site)
        run(["git", "add", "-A"], cwd=site)
        run(["git", "commit", "-q", "-m", f"ポータルを公開（main {head} から生成）"], cwd=site)
        if dry:
            print(f"--dry-run: {site} にコミットを作った。push はしない。")
            return
        run(["git", "push", "-f", "-q", remote, f"{BRANCH}:{BRANCH}"], cwd=site)
    print(f"{remote} の {BRANCH} に push した（main {head} から生成）。")


if __name__ == "__main__":
    main()
