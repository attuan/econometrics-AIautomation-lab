"""リポジトリ直下の .env を読み、まだ設定されていない環境変数だけに入れる。

- 値は表示しない。ログにも出さない。
- 使い方: from lib.envload import load_env; load_env()
- 確認したいときは have("OPENALEX_API_KEY") で、値ではなく有無だけを見る。
"""
import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


def load_env(path=ENV_PATH):
    if not path.exists():
        return []
    loaded = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v
            loaded.append(k)
    return loaded  # 読み込んだ変数の名前だけ返す（値は返さない）


def have(name):
    return bool(os.environ.get(name))


if __name__ == "__main__":
    names = load_env()
    for k in ("OPENALEX_API_KEY", "OPENAI_API_KEY", "SEMANTIC_SCHOLAR_API_KEY"):
        print(f"{k}: {'あり' if have(k) else 'なし'}")
