#!/usr/bin/env python3
"""段階4: 事前分析計画（結果変数を見る前の論文）をロックする。

    python3 tools/lock_pap.py <project>           # ロックする（人の承認を取ってから）
    python3 tools/lock_pap.py <project> --check   # ロック後に変わったファイルを調べる

paper/main.tex と hypotheses/hypotheses.json（と paper/chapters/*.tex）の SHA-256 を
<project>/prereg/LOCK.json に追記する。過去のロックは消さない（履歴になる）。
--check の終了コード: 0=ロック済みで変更なし、1=未ロック、2=ロック後に変更あり。
結果の追記（result 箱）でも main.tex のハッシュは変わる。--check は「変わった」ことだけを知らせ、
仕様の変更かどうかは更新履歴で人が確かめる。
"""
import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def targets(proj):
    files = [proj / "paper/main.tex", proj / "hypotheses/hypotheses.json"]
    files += sorted((proj / "paper/chapters").glob("*.tex"))
    return [f for f in files if f.exists()]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_head(proj):
    try:
        return subprocess.run(["git", "rev-parse", "HEAD"], cwd=proj, capture_output=True, text=True, check=True).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    proj = Path(args[0]).resolve()
    lock_path = proj / "prereg/LOCK.json"
    history = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.exists() else []
    now = {str(f.relative_to(proj)): digest(f) for f in targets(proj)}
    if not now:
        sys.exit(f"{proj} に paper/main.tex が無い")

    if "--check" in sys.argv:
        if not history:
            print("未ロック: 実データの結果変数に触れない。")
            sys.exit(1)
        last = history[-1]
        changed = [f for f in sorted(set(now) | set(last["files"])) if now.get(f) != last["files"].get(f)]
        print(f"最後のロック: {last['locked_at']}（{len(history)} 回目）")
        if changed:
            print("ロック後に変わったファイル: " + ", ".join(changed))
            print("仕様を変えたなら、更新履歴に理由を書いてから再ロックする。結果の追記だけなら問題ない。")
            sys.exit(2)
        print("変更なし。")
        sys.exit(0)

    history.append({
        "locked_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "git_head": git_head(proj),
        "files": now,
    })
    lock_path.parent.mkdir(exist_ok=True)
    lock_path.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"ロックした（{len(history)} 回目）: {lock_path}")
    print("このファイルをコミットすると、時点の証拠になる。外部の登録簿に出すかは DECISIONS.md D3。")


if __name__ == "__main__":
    main()
