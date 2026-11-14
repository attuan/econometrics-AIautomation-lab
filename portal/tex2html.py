"""LaTeX（このラボの研究ノートの書き方）→ HTML。

対応する書き方（AGENTS.md §3 と同じ一覧）:
  節: \\section \\subsection \\subsubsection（* つきも可）、\\label \\ref
  文字: \\textbf \\emph \\textit \\texttt \\verb|..| \\url \\href \\footnote
  引用: \\cite \\parencite \\citep（著者 年）、\\textcite \\citet 著者（年）、\\printbibliography
  箱: abstract chaptermap keypoint term pitfall debate hypothesis design result decision
  リスト: itemize enumerate description
  表: table + tabular / tabularx（booktabs、\\multicolumn）
  図: figure + \\includegraphics または tikzpicture（単独の tikzpicture も可。PNG に描く）
  数式: $..$ \\[..\\] equation align gather（MathJax がブラウザで組む）
  その他: \\input{..}
これ以外のコマンド・環境は警告を出して中身だけ残す。
"""
import hashlib
import html
import re
import shutil
import subprocess
from pathlib import Path

BOXES = {"chaptermap": "この文書の地図", "keypoint": "要点", "term": "用語", "pitfall": "落とし穴", "debate": "論争・別の説明",
         "hypothesis": "仮説", "design": "識別戦略・方法", "result": "結果", "decision": "判断（Go/No-Go）"}
BOX_ARG = {"term", "hypothesis", "design", "result"}
MATH_ENVS = {"equation", "equation*", "align", "align*", "gather", "gather*", "multline", "multline*"}
DROP = {"maketitle", "centering", "small", "footnotesize", "scriptsize", "normalsize", "large", "Large", "noindent", "par", "hfill",
        "newpage", "clearpage", "tableofcontents", "toprule", "midrule", "bottomrule", "hline", "sffamily", "bfseries", "medskip",
        "smallskip", "bigskip", "appendix", "protect", "displaystyle", "linewidth", "textwidth", "raggedright"}
DROP_ARG = {"vspace": 1, "hspace": 1, "setlength": 2, "addbibresource": 1, "graphicspath": 1, "pagestyle": 1, "thispagestyle": 1,
            "setcounter": 2, "renewcommand": 2, "bibliography": 1}
KEEP_ARG = {"textcolor": 2, "mbox": 1, "text": 1, "textsf": 1, "textrm": 1, "underline": 1, "multirow": 3}
LT, GT, AMP = "\x02", "\x03", "\x04"


def read_group(s, i, open_="{", close="}"):
    """s[i] が open_ のとき、対応する close までの中身と、その次の位置を返す。無ければ (None, i)。"""
    j = i
    while j < len(s) and s[j] in " \t\n":
        j += 1
    if j >= len(s) or s[j] != open_:
        return None, i
    depth, k = 0, j
    while k < len(s):
        c = s[k]
        if c == "\\":
            k += 2
            continue
        if c == open_:
            depth += 1
        elif c == close:
            depth -= 1
            if depth == 0:
                return s[j + 1:k], k + 1
        k += 1
    return None, i


def parse_bib(path):
    entries = {}
    if not path.exists():
        return entries
    for kind, key, body in re.findall(r"@(\w+)\s*\{\s*([^,\s]+)\s*,(.*?)\n\}", path.read_text(encoding="utf-8"), re.S):
        e = {"kind": kind.lower()}
        for m in re.finditer(r"\b(\w+)\s*=\s*", body):
            val, _ = read_group(body, m.end())
            if val is None:
                m2 = re.match(r"(\d+)", body[m.end():])
                val = m2.group(1) if m2 else None
            if val is not None and m.group(1).lower() not in e:
                e[m.group(1).lower()] = re.sub(r"\s+", " ", val).strip()
        entries[key] = e
    return entries


def detex(s):
    s = re.sub(r"\{\\[\"'`^~]\{?(\w)\}?\}|\\[\"'`^~]\{?(\w)\}?", lambda m: m.group(1) or m.group(2), s)
    return re.sub(r"[{}]", "", s).replace("--", "–").replace("\\&", "&")


def short_authors(e):
    raw = e.get("author", e.get("title", "?"))
    if raw.startswith("{"):
        return detex(raw)
    names = [detex(a.split(",")[0].strip() if "," in a else a.strip().split(" ")[-1]) for a in raw.split(" and ")]
    return names[0] if len(names) == 1 else f"{names[0]} and {names[1]}" if len(names) == 2 else f"{names[0]} et al."


class Converter:
    def __init__(self, src, root, dist, out, warn):
        self.src, self.root, self.dist, self.out, self.warn = Path(src), Path(root), Path(dist), out, warn
        self.dir = self.src.parent
        self.store = []          # 置き換え済みの HTML 片（[HTML, ブロックか]）
        self.labels = {}         # ラベル → (種類, 番号)
        self.cited = []
        self.title = self.src.parent.name
        self.rel = str(self.src.relative_to(self.root))
        self.outdir = (self.dist / out).parent
        self.assetdir = self.outdir / (Path(out).stem + "_files")

    # ---- 置き換え片 ----
    def put(self, htm, block=False):
        self.store.append(htm)
        return f"\x00{'B' if block else 'I'}{len(self.store) - 1}\x00"

    def restore(self, s):
        for _ in range(50):
            new = re.sub(r"\x00[BI](\d+)\x00", lambda m: self.store[int(m.group(1))], s)
            if new == s:
                break
            s = new
        return s.replace(LT, "&lt;").replace(GT, "&gt;").replace(AMP, "&amp;")

    # ---- 全体 ----
    def convert(self):
        s = self.src.read_text(encoding="utf-8")
        s = self.strip_comments(s)
        s = self.expand_inputs(s)
        pre, _, body = s.partition("\\begin{document}")
        body = body.split("\\end{document}")[0]
        meta = {}
        for k in ("title", "author", "date"):
            m = re.search(rf"\\{k}\s*(?=\{{)", pre)
            if m:
                meta[k], _ = read_group(pre, m.end())
        self.bib = {}
        for m in re.finditer(r"\\addbibresource\{([^}]+)\}", pre):
            self.bib.update(parse_bib(self.dir / m.group(1)))
        self.pdf = {}
        master = self.root / "literature/papers.csv"
        if master.exists():
            import csv
            with open(master, newline="", encoding="utf-8") as f:
                self.pdf = {r["id"]: r.get("pdf_url", "") for r in csv.DictReader(f)}
        self.scan_labels(body)

        body = re.sub(r"\\verb(.)(.*?)\1", lambda m: self.put("<code>" + html.escape(m.group(2)) + "</code>"), body)
        body = re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", lambda m: self.tikz(m.group(0)), body, flags=re.S)
        body = body.replace("\\&", AMP).replace("\\$", "\x05").replace("<", LT).replace(">", GT)
        body = re.sub(r"\\\[(.*?)\\\]", lambda m: self.math("\\[" + m.group(1) + "\\]", True), body, flags=re.S)
        body = re.sub(r"\$\$(.*?)\$\$", lambda m: self.math("\\[" + m.group(1) + "\\]", True), body, flags=re.S)
        body = re.sub(r"\$(.+?)\$", lambda m: self.math("\\(" + m.group(1) + "\\)", False), body, flags=re.S)
        body = body.replace("\x05", "$")

        env = re.compile(r"\\begin\{([A-Za-z]+\*?)\}((?:(?!\\begin\{|\\end\{).)*?)\\end\{\1\}", re.S)
        while True:
            m = env.search(body)
            if not m:
                break
            body = body[:m.start()] + self.environment(m.group(1), m.group(2)) + body[m.end():]

        htm = self.flow(body)
        head = [f"<h1>{self.restore(self.inline(meta.get('title', self.title)))}</h1>"]
        self.title = re.sub(r"<[^>]+>", "", head[0])
        byline = " ・ ".join(self.restore(self.inline(meta[k])) for k in ("author", "date") if meta.get(k))
        head.append(f'<p class="byline">{byline}</p><!--pdf-->')
        return "\n".join(head) + "\n" + self.restore(htm)

    def strip_comments(self, s):
        s = re.sub(r"(?m)^[ \t]*%.*\n", "", s)
        return re.sub(r"(?<!\\)%.*", "", s)

    def expand_inputs(self, s, depth=0):
        def rep(m):
            name = m.group(1)
            for cand in (self.dir / name, self.dir / (name + ".tex")):
                if cand.is_file():
                    if "lab_preamble" in name:
                        return ""
                    return self.expand_inputs(self.strip_comments(cand.read_text(encoding="utf-8")), depth + 1)
            self.warn(f"{self.rel}: \\input のファイルが無い: {name}")
            return ""
        return re.sub(r"\\input\{([^}]+)\}", rep, s) if depth < 5 else s

    def scan_labels(self, body):
        """文書の順に、節・図・表の番号を振り、ラベルに対応させる。"""
        n = {"sec": 0, "sub": 0, "fig": 0, "tab": 0}
        cur, in_float = None, None
        for m in re.finditer(r"\\(section|subsection)\{|\\begin\{(figure|table)\}|\\end\{(figure|table)\}|\\label\{([^}]+)\}", body):
            if m.group(1) == "section":
                n["sec"] += 1
                n["sub"] = 0
                cur = ("節", str(n["sec"]))
            elif m.group(1) == "subsection":
                n["sub"] += 1
                cur = ("節", f"{n['sec']}.{n['sub']}")
            elif m.group(2):
                k = "fig" if m.group(2) == "figure" else "tab"
                n[k] += 1
                in_float = ("図" if k == "fig" else "表", str(n[k]))
            elif m.group(3):
                in_float = None
            elif m.group(4):
                lab = m.group(4)
                if lab.startswith("eq:"):
                    self.labels[lab] = ("式", None)
                elif in_float or cur:
                    self.labels[lab] = in_float or cur
        self.counter = {"sec": 0, "sub": 0, "fig": 0, "tab": 0}

    # ---- 数式・図 ----
    def math(self, tex, block):
        tex = tex.replace(LT, "<").replace(GT, ">").replace(AMP, "\\&")
        tex = re.sub(r"\x00[BI](\d+)\x00", lambda m: self.store[int(m.group(1))], tex)
        return self.put(("<div class='math'>" if block else "<span class='math'>") + html.escape(tex, quote=False) + ("</div>" if block else "</span>"), block)

    def tikz(self, code):
        pre = (self.root / "common/lab_preamble.tex").read_text(encoding="utf-8")
        defs = "\n".join(re.findall(r"\\definecolor.*|\\usetikzlibrary.*|\\pgfplotsset.*", pre))
        doc = ("\\documentclass[border=8pt]{standalone}\n\\usepackage{luatexja}\\usepackage{amsmath,amssymb,xcolor,tikz,pgfplots}\n"
               + defs + "\n\\begin{document}\n" + code + "\n\\end{document}\n")
        key = hashlib.sha256(doc.encode()).hexdigest()[:16]
        cache = self.root / "portal/.cache"
        cache.mkdir(exist_ok=True)
        png = cache / f"{key}.png"
        if not png.exists():
            (cache / f"{key}.tex").write_text(doc, encoding="utf-8")
            r = subprocess.run(["lualatex", "-interaction=nonstopmode", "-halt-on-error", f"{key}.tex"], cwd=cache, capture_output=True, text=True)
            if r.returncode or not (cache / f"{key}.pdf").exists():
                self.warn(f"{self.rel}: TikZ の図を描けない（portal/.cache/{key}.log）")
                return self.put('<p class="warn">（図を描けなかった）</p>', True)
            subprocess.run(["gs", "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m", "-r200", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4",
                            f"-sOutputFile={png}", str(cache / f"{key}.pdf")], check=True)
            for ext in ("aux", "log", "pdf", "tex"):
                (cache / f"{key}.{ext}").unlink(missing_ok=True)
        self.assetdir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(png, self.assetdir / png.name)
        return self.put(f'<img class="fig" src="{self.assetdir.name}/{png.name}" alt="">', True)

    def graphics(self, name):
        cands = [self.dir / name, self.dir / "figs" / name]
        cands += [c.with_suffix(e) for c in list(cands) for e in (".png", ".svg", ".pdf", ".jpg")]
        src = next((c for c in cands if c.is_file()), None)
        if not src:
            self.warn(f"{self.rel}: 図のファイルが無い: {name}")
            return self.put('<p class="warn">（図が無い）</p>', True)
        self.assetdir.mkdir(parents=True, exist_ok=True)
        dst = self.assetdir / src.name
        if src.suffix == ".pdf":
            dst = dst.with_suffix(".png")
            subprocess.run(["gs", "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m", "-r200", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4",
                            f"-sOutputFile={dst}", str(src)], check=True)
        else:
            shutil.copy2(src, dst)
        return self.put(f'<img class="fig" src="{self.assetdir.name}/{dst.name}" alt="">', True)

    # ---- 環境 ----
    def environment(self, name, body):
        if name in MATH_ENVS:
            return self.math(f"\\begin{{{name}}}{body}\\end{{{name}}}", True)
        if name == "abstract":
            return self.put(f'<div class="box abstract"><div class="box-title">要旨</div>{self.flow(body)}</div>', True)
        if name in BOXES:
            title = BOXES[name]
            opt, i = read_group(body, 0, "[", "]")
            body = body[i:] if opt is not None else body
            if name in BOX_ARG:
                arg, i = read_group(body, 0)
                if arg is not None:
                    title, body = f"{title}：{self.inline(arg)}", body[i:]
            elif opt:
                title = f"{title}：{self.inline(opt)}"
            return self.put(f'<div class="box {name}"><div class="box-title">{title}</div>{self.flow(body)}</div>', True)
        if name in ("itemize", "enumerate", "description"):
            opt, i = read_group(body, 0, "[", "]")
            body = body[i:] if opt is not None else body
            parts = re.split(r"\\item\b", body)[1:]
            tag = {"itemize": "ul", "enumerate": "ol", "description": "dl"}[name]
            items = []
            for p in parts:
                lab, i = read_group(p, 0, "[", "]")
                if tag == "dl":
                    items.append(f"<dt>{self.inline(lab or '')}</dt><dd>{self.flow(p[i:], True)}</dd>")
                else:
                    items.append(f"<li>{self.flow(p, True)}</li>")
            return self.put(f"<{tag}>{''.join(items)}</{tag}>", True)
        if name in ("tabular", "tabularx", "tabular*", "longtable"):
            return self.table(name, body)
        if name in ("table", "figure"):
            kind = "fig" if name == "figure" else "tab"
            self.counter[kind] += 1
            body = re.sub(r"^\s*\[[^\]]*\]", "", body)
            cap = ""
            m = re.search(r"\\caption\s*(?=\{)", body)
            if m:
                cap, j = read_group(body, m.end())
                body = body[:m.start()] + body[j:]
            lab = re.search(r"\\label\{([^}]+)\}", body)
            body = re.sub(r"\\label\{[^}]+\}", "", body)
            num = f"{'図' if kind == 'fig' else '表'}{self.counter[kind]}"
            idattr = f' id="{lab.group(1)}"' if lab else ""
            cap_html = f"<figcaption><b>{num}</b>　{self.inline(cap)}</figcaption>"
            inner = self.flow(body)
            return self.put(f'<figure class="{kind}"{idattr}>' + (cap_html + inner if kind == "tab" else inner + cap_html) + "</figure>", True)
        if name == "center":
            return self.put(f'<div class="center">{self.flow(body)}</div>', True)
        if name in ("axis", "scope"):
            return body
        self.warn(f"{self.rel}: 対応していない環境 {name}（中身だけ残す）")
        return self.put(self.flow(body), True)

    def table(self, name, body):
        for _ in range({"tabular": 1, "longtable": 1}.get(name, 2)):
            g, i = read_group(body, 0)
            body = body[i:] if g is not None else body
        body = re.sub(r"\\(toprule|bottomrule)\b", "", body)
        body = re.sub(r"\\(midrule|hline)\b|\\cmidrule(\([^)]*\))?\{[^}]*\}", "\x06", body)
        rows, head_done, out = [], False, []
        for chunk in re.split(r"\\\\(?:\[[^\]]*\])?", body):
            seps = chunk.count("\x06")
            chunk = chunk.replace("\x06", "").strip()
            if seps and rows and not head_done:
                head_done = True
                out.append("<thead>" + "".join(rows) + "</thead><tbody>")
                rows = []
            if not chunk:
                continue
            cells = []
            for c in chunk.split("&"):
                c = c.strip()
                span = ""
                m = re.match(r"\\multicolumn\s*\{(\d+)\}", c)
                if m:
                    _, j = read_group(c, m.end())
                    txt, _ = read_group(c, j)
                    c, span = txt or "", f' colspan="{m.group(1)}"'
                tag = "td" if head_done else "th"
                cells.append(f"<{tag}{span}>{self.inline(c)}</{tag}>")
            rows.append(f'<tr{" class=sep" if seps and head_done and rows else ""}>' + "".join(cells) + "</tr>")
        if not head_done:
            out.append("<tbody>")
            rows = [r.replace("<th", "<td").replace("</th>", "</td>") for r in rows]
        out.append("".join(rows) + "</tbody>")
        return self.put('<div class="tablewrap"><table>' + "".join(out) + "</table></div>", True)

    # ---- 段落と文字 ----
    def flow(self, s, compact=False):
        """空行で段落に分ける。ブロックの置き換え片は段落に入れない。"""
        s = self.inline(s)
        out = []
        for chunk in re.split(r"\n\s*\n", s):
            for part in re.split(r"(\x00B\d+\x00)", chunk):
                part = part.strip()
                if not part:
                    continue
                if part.startswith("\x00B"):
                    out.append(part)
                else:
                    out.append(part if compact and "\n\n" not in s.strip() else f"<p>{part}</p>")
        return "".join(out) if compact else "\n".join(out)

    def cite(self, keys, textual):
        parts = []
        for k in [x.strip() for x in keys.split(",")]:
            e = self.bib.get(k)
            if not e:
                self.warn(f"{self.rel}: 文献キーが bib に無い: {k}")
                parts.append(f"?{k}")
                continue
            if k not in self.cited:
                self.cited.append(k)
            a, y = html.escape(short_authors(e)), e.get("year", "n.d.")
            parts.append(f'<a href="#ref-{k}">{a}（{y}）</a>' if textual else f'<a href="#ref-{k}">{a}, {y}</a>')
        return "、".join(parts) if textual else "（" + "; ".join(parts) + "）"

    def references(self):
        items = []
        for k in sorted(self.cited, key=lambda k: short_authors(self.bib[k]).lower()):
            e = self.bib[k]
            au = html.escape(detex(e.get("author", "")).replace(" and ", ", "))
            t = html.escape(detex(e.get("title", "")))
            where = html.escape(detex(" ".join(x for x in (e.get("journal", ""), e.get("volume", ""), f"({e['number']})" if e.get("number") else "",
                                                           e.get("pages", ""), e.get("note", "")) if x)))
            link = (f' <a href="https://doi.org/{e["doi"]}">doi:{html.escape(e["doi"])}</a>' if e.get("doi")
                    else f' <a href="{html.escape(e["url"])}">{html.escape(e["url"])}</a>（閲覧 {e.get("urldate", "")}）' if e.get("url") else "")
            pdf = f' <a class="pdflink" href="{html.escape(self.pdf[k])}">PDF</a>' if self.pdf.get(k) else ""
            items.append(f'<li id="ref-{k}">{au}（{e.get("year", "n.d.")}）「{t}」{where}{link}{pdf}</li>')
        return self.put('<h2 id="refs">参考文献</h2><ul class="refs">' + "".join(items) + "</ul>", True)

    def heading(self, level, star, text):
        num = ""
        if not star:
            if level == 2:
                self.counter["sec"] += 1
                self.counter["sub"] = 0
                num = f"{self.counter['sec']}　"
            elif level == 3:
                self.counter["sub"] += 1
                num = f"{self.counter['sec']}.{self.counter['sub']}　"
        return self.put(f"<h{level}>{num}{self.inline(text)}</h{level}>", True)

    def inline(self, s):
        out, i = [], 0
        pat = re.compile(r"\\([A-Za-z]+)(\*?)|\\(.)", re.S)
        while True:
            m = pat.search(s, i)
            if not m:
                out.append(s[i:])
                break
            out.append(s[i:m.start()])
            i = m.end()
            if m.group(3) is not None:
                c = m.group(3)
                out.append({"\\": "<br>", " ": " ", ",": " ", ";": " ", "%": "%", "_": "_", "#": "#", "{": "{", "}": "}", "\n": " ", "-": "", "/": ""}.get(c, c))
                if c == "\\":
                    opt, j = read_group(s, i, "[", "]")
                    i = j if opt is not None else i
                continue
            name, star = m.group(1), m.group(2)
            arg = lambda: self._arg(s, i)
            if name in ("section", "subsection", "subsubsection"):
                a, i = arg()
                out.append(self.heading({"section": 2, "subsection": 3, "subsubsection": 4}[name], star, a or ""))
            elif name in ("textbf", "emph", "textit", "texttt"):
                a, i = arg()
                tag = {"textbf": "b", "emph": "em", "textit": "em", "texttt": "code"}[name]
                out.append(f"<{tag}>{self.inline(a or '')}</{tag}>")
            elif name in ("cite", "parencite", "citep", "textcite", "citet", "autocite"):
                opt, j = read_group(s, i, "[", "]")
                i = j if opt is not None else i
                a, i = arg()
                out.append(self.put(self.cite(a or "", name in ("textcite", "citet"))))
            elif name == "label":
                a, i = arg()
                out.append(self.put(f'<span id="{a}"></span>'))
            elif name in ("ref", "eqref", "autoref"):
                a, i = arg()
                kind, num = self.labels.get(a, (None, None))
                if kind == "式":
                    out.append(self.put(f"<span class='math'>\\(\\ref{{{a}}}\\)</span>"))
                elif kind:
                    out.append(self.put(f'<a href="#{a}">{num}</a>'))
                else:
                    self.warn(f"{self.rel}: 参照先のラベルが無い: {a}")
                    out.append("??")
            elif name == "url":
                a, i = arg()
                out.append(self.put(f'<a href="{html.escape(a)}">{html.escape(a)}</a>'))
            elif name == "href":
                a, i = arg()
                b, i = arg()
                out.append(self.put(f'<a href="{html.escape(a)}">') + self.inline(b or "") + self.put("</a>"))
            elif name == "footnote":
                a, i = arg()
                out.append(f'<span class="fn">（注：{self.inline(a or "")}）</span>')
            elif name == "includegraphics":
                opt, j = read_group(s, i, "[", "]")
                i = j if opt is not None else i
                a, i = arg()
                out.append(self.graphics(a))
            elif name == "printbibliography":
                opt, j = read_group(s, i, "[", "]")
                i = j if opt is not None else i
                out.append("\x07")  # 最後に差し替える（引用を全部見てから）
            elif name == "item":
                out.append("\\item")
            elif name in DROP:
                pass
            elif name in DROP_ARG:
                for _ in range(DROP_ARG[name]):
                    _, i = arg()
            elif name in KEEP_ARG:
                a = ""
                for _ in range(KEEP_ARG[name]):
                    a, i = arg()
                out.append(self.inline(a or ""))
            elif name in ("quad", "qquad"):
                out.append("　")
            elif name in ("ldots", "dots"):
                out.append("…")
            elif name == "LaTeX":
                out.append("LaTeX")
            else:
                self.warn(f"{self.rel}: 対応していないコマンド \\{name}")
        s = "".join(out)
        s = re.sub(r"(?<!\\)[{}]", "", s).replace("~", "\u00a0").replace("---", "—").replace("``", "“").replace("''", "”")
        if "\x07" in s:
            s = s.replace("\x07", self.references())
        return s

    def _arg(self, s, i):
        a, j = read_group(s, i)
        return (a, j) if a is not None else ("", i)
