"""Markdown → HTML（このリポジトリで使う書き方だけに対応した小さな変換器）。

対応: 見出し、段落、箇条書き（入れ子は字下げ2つ以上）、番号つきリスト、表、コードブロック、引用、
画像（1行に1つ → 図とキャプション）、リンク、太字、`コード`、<URL>、水平線。
リポジトリ内のファイルへのリンクは data-src 属性にして、build.py がポータルのページに付け替える。
"""
import html
import posixpath
import re


def inline(s, base, assets):
    codes = []

    def keep(m):
        codes.append("<code>" + html.escape(m.group(1)) + "</code>")
        return f"\x00{len(codes) - 1}\x00"

    s = re.sub(r"`([^`]+)`", keep, s)
    s = html.escape(s, quote=False)

    def link(m):
        text, url = m.group(1), m.group(2)
        if re.match(r"(https?:|mailto:|#)", url):
            return f'<a href="{url}">{text}</a>'
        if url.startswith("/"):
            return text
        target = posixpath.normpath(posixpath.join(str(base), url))
        return f'<a data-src="{target}">{text}</a>'

    s = re.sub(r"(?<!!)\[([^\]]+)\]\(([^)\s]+)\)", link, s)
    s = re.sub(r"&lt;(https?://[^\s&]+)&gt;", r'<a href="\1">\1</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    return re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], s)


def convert(text, base):
    """(本文 HTML, コピーすべき画像の相対パスのリスト) を返す。base は正本のあるディレクトリ（リポジトリ相対）。"""
    assets, out, lines, i = [], [], text.splitlines(), 0
    il = lambda s: inline(s, base, assets)

    def slug(s):
        return re.sub(r"[^\w]+", "-", s).strip("-")

    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
        elif line.startswith("```"):
            j = i + 1
            while j < len(lines) and not lines[j].startswith("```"):
                j += 1
            out.append("<pre><code>" + html.escape("\n".join(lines[i + 1:j])) + "</code></pre>")
            i = j + 1
        elif m := re.match(r"(#{1,4}) (.*)", line):
            n = len(m.group(1))
            out.append(f'<h{n} id="{slug(m.group(2))}">{il(m.group(2))}</h{n}>')
            i += 1
        elif re.match(r"-{3,}\s*$", line):
            out.append("<hr>")
            i += 1
        elif m := re.match(r"!\[([^\]]*)\]\(([^)\s]+)\)\s*$", line):
            target = posixpath.normpath(posixpath.join(str(base), m.group(2)))
            assets.append(target)
            out.append(f'<figure><img src="@root/{target}" alt=""><figcaption>{il(m.group(1))}</figcaption></figure>')
            i += 1
        elif line.startswith(">"):
            j = i
            while j < len(lines) and lines[j].startswith(">"):
                j += 1
            out.append('<blockquote class="note">' + "<br>".join(il(x[1:].strip()) for x in lines[i:j]) + "</blockquote>")
            i = j
        elif line.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            j = i
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                j += 1
            rows = [[c.strip() for c in re.split(r"(?<!\\)\|", x.strip().strip("|"))] for x in lines[i:j]]
            h = ['<div class="tablewrap"><table><thead><tr>' + "".join(f"<th>{il(c)}</th>" for c in rows[0]) + "</tr></thead><tbody>"]
            for r in rows[2:]:
                h.append("<tr>" + "".join(f"<td>{il(c)}</td>" for c in r) + "</tr>")
            out.append("".join(h) + "</tbody></table></div>")
            i = j
        elif re.match(r"\s*([-*]|\d+\.) ", line):
            j = i
            while j < len(lines) and (re.match(r"\s*([-*]|\d+\.) ", lines[j]) or (lines[j].startswith("  ") and lines[j].strip())):
                j += 1
            out.append(listing(lines[i:j], il))
            i = j
        else:
            j = i
            while j < len(lines) and lines[j].strip() and not re.match(r"(#{1,4} |```|>|\s*([-*]|\d+\.) |!\[)", lines[j]) and not lines[j].lstrip().startswith("|"):
                j += 1
            j = max(j, i + 1)
            out.append("<p>" + il(" ".join(x.strip() for x in lines[i:j])) + "</p>")
            i = j
    return "\n".join(out), assets


def listing(lines, il):
    """字下げで入れ子を作る。同じ深さの項目は同じリストに入る。"""
    items = []  # (深さ, 番号つきか, 文)
    for x in lines:
        m = re.match(r"(\s*)([-*]|\d+\.) (.*)", x)
        if m:
            items.append([len(m.group(1)), m.group(2)[0].isdigit(), m.group(3)])
        elif items:
            items[-1][2] += " " + x.strip()

    def build(k, depth):
        tag = "ol" if items[k][1] else "ul"
        h = [f"<{tag}>"]
        while k < len(items) and items[k][0] >= depth:
            if items[k][0] > depth:
                sub, k = build(k, items[k][0])
                h[-1] = h[-1][:-5] + sub + "</li>"
            else:
                h.append(f"<li>{il(items[k][2])}</li>")
                k += 1
        return "".join(h) + f"</{tag}>", k

    return build(0, items[0][0])[0]
