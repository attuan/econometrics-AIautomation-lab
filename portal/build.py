#!/usr/bin/env python3
"""ポータルを作る。正本（README.md・*.md・*/paper/**/main.tex・CSV・JSON・動画）→ portal/dist/

    python3 portal/build.py            # 生成（変換警告があれば終了コード 1）
    python3 -m http.server -d portal/dist 4321   # http://localhost:4321 で見る

Python の標準ライブラリだけで動く。図（TikZ）の描画にだけ lualatex と gs を使う。
載せたくないものは、先頭が `_` のディレクトリに置く。生成物（portal/dist）は手で直さない。
LaTeX の変換は portal/tex2html.py（対応する書き方は AGENTS.md §3）。
"""
import csv
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "portal/dist"
sys.path.insert(0, str(ROOT / "portal"))
sys.path.insert(0, str(ROOT / "tools"))
import md2html  # noqa: E402
import score_themes  # noqa: E402
import tex2html  # noqa: E402

SKIP = {"portal", "common", "tools", "theme", "deepdive", "literature", "node_modules"}
TRACK = {"causal": "因果推論", "structural": "構造推定", "method": "推定量・手法"}
STATUS = {"untested": "未検証", "supported": "支持", "rejected": "棄却", "inconclusive": "保留", "dropped": "取り下げ"}
warnings = []


def warn(msg):
    warnings.append(msg)
    print("  警告:", msg)


def esc(s):
    return html.escape(str(s), quote=True)


def first_heading(path):
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem


def projects():
    out = []
    for d in sorted(ROOT.iterdir()):
        if d.is_dir() and not d.name.startswith((".", "_")) and d.name not in SKIP and (d / "README.md").exists():
            out.append(d)
    return out


def tex_docs(base):
    """base/paper/main.tex と base/paper/<名前>/main.tex（`_` で始まるものを除く）。"""
    docs = []
    if (base / "paper/main.tex").exists():
        docs.append(base / "paper/main.tex")
    if (base / "paper").is_dir():
        for d in sorted((base / "paper").iterdir()):
            if d.is_dir() and not d.name.startswith("_") and (d / "main.tex").exists():
                docs.append(d / "main.tex")
    return docs


class Site:
    def __init__(self):
        self.pages = []     # (出力パス, 題, 本文 HTML, オプション)
        self.nav = []       # (見出し, [(題, 出力パス)])
        self.linkmap = {}   # 正本の相対パス → 出力パス

    def add(self, out, title, body, src=None, **opt):
        self.pages.append((out, title, body, opt))
        if src:
            self.linkmap[str(src)] = out
        return (title, out)

    def write(self):
        for out, title, body, opt in self.pages:
            depth = out.count("/")
            root = "../" * depth
            body = self.fix_links(body, out, root)
            nav = []
            for head, items in self.nav:
                nav.append(f"<h2>{esc(head)}</h2><ul>")
                for t, o in items:
                    cur = ' class="on" aria-current="page"' if o == out else ""
                    nav.append(f'<li><a{cur} href="{root}{o}">{esc(t)}</a></li>')
                nav.append("</ul>")
            mathjax = ""
            if opt.get("math"):
                mathjax = ("<script>MathJax={tex:{inlineMath:[['\\\\(','\\\\)']],tags:'ams'}};</script>"
                           '<script async src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js"></script>')
            page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | AI ネイティブ経済学ラボ</title>
<link rel="stylesheet" href="{root}assets/site.css">{mathjax}</head>
<body>
<header class="top"><button id="menu" aria-label="目次を開く">☰</button><a class="brand" href="{root}index.html">AI ネイティブ経済学ラボ</a></header>
<div class="layout">
<nav id="side">{''.join(nav)}</nav>
<main class="{opt.get('cls', 'doc')}">{body}
<footer>正本: <code>{esc(opt.get('source', ''))}</code>。このページは自動生成。直すときは正本を直して <code>python3 portal/build.py</code>。</footer>
</main></div>
<script>document.getElementById('menu').onclick=()=>document.body.classList.toggle('nav-open');</script>
{opt.get('script', '')}</body></html>
"""
            path = DIST / out
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(page, encoding="utf-8")

    def fix_links(self, body, out, root):
        """本文中の正本への相対リンク（data-src）を、ポータルのページへのリンクに直す。"""
        def rep(m):
            target = m.group(1)
            if target in self.linkmap:
                return f'href="{root}{self.linkmap[target]}"'
            warn(f"{out}: リンク先がポータルに無い: {target}")
            return 'href="#"'
        return re.sub(r'data-src="([^"]+)"', rep, body)


def md_page(site, src, out, title=None, cls="doc"):
    text = src.read_text(encoding="utf-8")
    if out == "index.html":  # トップページでは、編集者むけの冒頭の注記（> で始まる行）を出さない
        text = re.sub(r"(?m)\A(# .*\n\n)(?:>.*\n)+", r"\1", text)
    body, assets = md2html.convert(text, src.parent.relative_to(ROOT))
    for a in assets:  # 画像を同じ相対位置にコピー
        if (ROOT / a).exists():
            (DIST / a).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / a, DIST / a)
        else:
            warn(f"{src.relative_to(ROOT)}: 画像が無い: {a}")
    depth = out.count("/")
    body = body.replace('src="@root/', 'src="' + "../" * depth)
    return site.add(out, title or first_heading(src), body, src=src.relative_to(ROOT), source=str(src.relative_to(ROOT)), cls=cls)


def tex_page(site, src, out, label=None):
    rel = src.relative_to(ROOT)
    print(" ", rel)
    conv = tex2html.Converter(src, ROOT, DIST, out, warn)
    body = conv.convert()
    pdf = src.with_suffix(".pdf")
    if pdf.exists():
        shutil.copy2(pdf, (DIST / out).parent / (out.rsplit("/", 1)[-1].replace(".html", ".pdf")))
        body = body.replace("<!--pdf-->", f'<p class="pdf"><a href="{out.rsplit("/", 1)[-1].replace(".html", ".pdf")}">PDF で読む</a></p>')
    else:
        warn(f"{rel}: main.pdf が無い（先に latexmk）")
    return site.add(out, label or conv.title, body, src=rel, source=str(rel), math=True)


def csv_table(rows, cols, cls=""):
    h = [f'<div class="tablewrap"><table class="{cls}"><thead><tr>' + "".join(f"<th>{esc(c)}</th>" for c in cols) + "</tr></thead><tbody>"]
    for r in rows:
        h.append("<tr>" + "".join(f"<td>{esc(r.get(c, ''))}</td>" for c in cols) + "</tr>")
    h.append("</tbody></table></div>")
    return "".join(h)


def literature_page(site):
    with open(ROOT / "literature/papers.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    depth = {"full": "本文まで", "abstract": "要旨まで", "biblio": "書誌だけ"}
    tr = {**TRACK, "meta": "進め方・評価"}
    n = {k: sum(r["read_depth"] == k for r in rows) for k in depth}
    n_doi = sum(r["doi_ok"] == "yes" for r in rows)
    n_human = sum(bool(r["checked_by_human"]) for r in rows)
    tiles = (f'<div class="tile"><b>{len(rows)}</b><span>文献</span></div>'
             + "".join(f'<div class="tile"><b>{n[k]}</b><span>{v}読んだ</span></div>' for k, v in depth.items())
             + f'<div class="tile"><b>{n_doi}</b><span>DOI 照合済み</span></div><div class="tile"><b>{n_human}</b><span>人が原文で確認</span></div>')
    chips = "".join(f'<button data-f="{k}" aria-pressed="{str(k == "").lower()}">{v}</button>' for k, v in (("", "すべて"), *tr.items()))
    body = [f"<h1>文献マスター表</h1><p class='lead'>ラボで読んだ文献の一覧。重要度の高い順。論文の本体は保存していない。"
            f"「書誌だけ」の行の要点は、原文で確かめていない要約である。</p><div class='tiles'>{tiles}</div>"
            f'<div class="controls"><span id="litf" class="chips">{chips}</span></div>'
            '<div class="tablewrap"><table class="lit"><thead><tr><th>重要度</th><th>文献</th><th>型</th><th>設計・手法</th><th>要点</th><th>読んだ深さ</th></tr></thead><tbody>']
    n_pdf = sum(bool(r.get("pdf_url")) for r in rows)
    body[0] = body[0].replace("</div><div class=\"controls\">", f'<div class="tile"><b>{n_pdf}</b><span>公開 PDF あり</span></div></div><div class="controls">')
    for r in sorted(rows, key=lambda r: (-int(r["importance"] or 0), r["id"])):
        link = f'https://doi.org/{r["doi"]}' if r["doi"] else r["url"]
        au = tex2html.short_authors({"author": r["authors"]})
        note = f'<br><span class="sub">{esc(r["note"])}</span>' if r["note"] else ""
        body.append(f'<tr data-track="{esc(r["track"])}"><td class="num">{esc(r["importance"])}</td>'
                    f'<td><b>{esc(au)}（{esc(r["year"] or "n.d.")}）</b><br><a href="{esc(link)}">{esc(tex2html.detex(r["title"]))}</a>'
                    f'<br><span class="sub">{esc(tex2html.detex(r["venue"]))}　<code>{esc(r["id"])}</code></span>'
                    + (f' <a class="pdflink" href="{esc(r["pdf_url"])}">PDF</a>' if r.get("pdf_url") else "") + '</td>'
                    f'<td>{esc(tr.get(r["track"], r["track"]))}</td><td>{esc(r["design"])}</td>'
                    f'<td>{esc(r["key_finding"])}<br><span class="sub">{esc(r["significance"])}</span>{note}</td>'
                    f'<td><span class="badge d-{esc(r["read_depth"])}">{depth.get(r["read_depth"], r["read_depth"])}</span></td></tr>')
    body.append("</tbody></table></div>")
    script = ("<script>document.getElementById('litf').onclick=e=>{const f=e.target.dataset.f;if(f===undefined)return;"
              "document.querySelectorAll('#litf button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===f));"
              "document.querySelectorAll('table.lit tbody tr').forEach(r=>r.hidden=!!f&&r.dataset.track!==f);};</script>")
    return site.add("literature/index.html", "文献マスター表", "".join(body), src="literature/papers.csv", source="literature/papers.csv", cls="wide", script=script)


def themes_page(site):
    rows, axes, arows, groups = score_themes.load()
    keep = {"id", "track", "design", "cluster", "theme", "K", "status", "capped", "nearest", "data_check", "field", "design_type", "data_sources",
            "competitors", "lit_trend", "first_project", "risks", "sources", "rationale", "win_thesis", "raw_N", "raw_D", *axes}
    data = {
        "axes": [{"id": r["axis"], "group": r["group"], "name": r["name"]} for r in arows],
        "tracks": TRACK,
        "portfolio": score_themes.PORTFOLIO,
        "themes": [{k: (float(v) if k in axes or k == "K" else v) for k, v in r.items() if k in keep} for r in rows],
    }
    n_pilot = sum(r.get("status") == "pilot" for r in rows)
    n_screen = sum(r.get("status") == "screened" for r in rows)
    n_cap = sum(bool(r["capped"]) for r in rows)
    banner = ""
    if n_pilot:
        banner = (f'<div class="box pitfall"><div class="box-title">試行採点です</div><p>{len(rows)}件中{n_pilot}件は、AI の事前知識だけで採点した試行である。'
                  "出典調査をしておらず、順位は仕組みの動作見本にすぎない。テーマ選定の根拠にしないこと。</p></div>")
    elif n_screen:
        banner = (f'<div class="box pitfall"><div class="box-title">一次採点です</div><p>{len(rows)}件中{n_screen}件は一次採点である。'
                  "点は AI の事前知識にもとづく。近い既存研究は書誌を照合しただけで、本文は読んでいない。データは所在を確かめただけで、必要な変数の有無は見ていない。"
                  f"根拠の欄が空で上限2点になっているテーマが{n_cap}件ある。上位の候補は、選ぶ前に個別の調査（段階2）で確かめること。</p></div>")
    body = f"""<h1>星取り表：テーマを選ぶ</h1>
<div class="box chaptermap"><div class="box-title">このページの使い方</div>
<ol><li><b>4つの点を見る。</b>問いの価値・信頼性・実行可能性・競争と出口。合計は4つの掛け算なので、1つが弱いと全体が下がる。</li>
<li><b>重く見たい項目で並べ替える。</b>見出しを押すと、その群（15軸を表示していれば、その軸）の順に並ぶ。軸に重みは付けていない。</li>
<li><b>行を押す。</b>15軸の内訳・採点の根拠・最初の一手・リスクが下に出る。</li>
<li><b>組合せで選ぶ。</b>候補に入れると、選ぶときの条件（同じ設計は{score_themes.PORTFOLIO['max_same_design']}個まで、各トラックから{score_themes.PORTFOLIO['min_per_track']}個以上）を満たすかが出る。決めるのは人である。</li></ol></div>
{banner}
<div class="controls"><span id="tracks" class="chips"></span>
<label><input type="checkbox" id="showaxes"> 15軸を表示</label><button id="copy">候補をコピー</button><span id="sortnote" class="sub"></span><span id="copied"></span></div>
<div id="picked" class="portfolio"></div>
<div class="tablewrap"><table id="hoshi" class="hoshi"></table></div>
<p class="legend">群の点は20〜100。◎=5　○=4　△=3　▲=2　×=1。* は根拠の欄が空で上限2点にした軸。見出しを押すと並べ替わる。軸の定義は <a data-src="theme/paper/main.tex">テーマをどう選ぶか</a>。</p>
<div id="detail" class="card" hidden></div>
<h2>軸の一覧</h2><div class="tablewrap"><table id="weights"></table></div>"""
    script = f'<script id="data" type="application/json">{json.dumps(data, ensure_ascii=False).replace("</", "<\\/")}</script><script src="../assets/themes.js"></script>'
    return site.add("theme/hoshitori.html", "星取り表", body, src="theme/research/themes.csv", source="theme/research/themes.csv", cls="wide", script=script)


def hypotheses_page(site, proj):
    src = proj / "hypotheses/hypotheses.json"
    hs = json.loads(src.read_text(encoding="utf-8"))
    count = {}
    for h in hs:
        count[h.get("status", "untested")] = count.get(h.get("status", "untested"), 0) + 1
    summary = "、".join(f"{STATUS.get(k, k)} {v}" for k, v in count.items())
    out = [f"<h1>研究仮説の一覧</h1><p class='lead'>{len(hs)}件（{esc(summary)}）。優先度の高い順。</p>"]
    fields = [("hypothesis", "仮説"), ("estimand", "推定対象・主張する性質"), ("method", "検証方法"), ("data", "データ"),
              ("success_metric", "成功基準"), ("rejection", "棄却条件"), ("null_value", "否定されたとき何が言えるか"),
              ("risk", "リスク"), ("novelty", "新しさ"), ("note", "メモ")]
    for h in sorted(hs, key=lambda h: -int(h.get("priority", 0))):
        st = h.get("status", "untested")
        out.append(f'<section class="card hyp"><h2 id="{esc(h["id"])}">{esc(h["id"])}　{esc(h.get("title", ""))}</h2>'
                   f'<p class="badges"><span class="badge st-{esc(st)}">{esc(STATUS.get(st, st))}</span>'
                   f'<span class="badge">{esc(TRACK.get(h.get("track", ""), h.get("track", "")))}</span>'
                   f'<span class="badge">型: {esc(h.get("type", ""))}</span><span class="badge">優先度 {esc(h.get("priority", ""))}</span></p>'
                   f'<p class="q">{esc(h.get("question", ""))}</p><dl>')
        for k, name in fields:
            v = h.get(k)
            if v:
                v = "、".join(f"{a}: {b}" for a, b in v.items()) if isinstance(v, dict) else v
                out.append(f"<dt>{name}</dt><dd>{esc(v)}</dd>")
        out.append("</dl></section>")
    return site.add(f"{proj.name}/hypotheses.html", "研究仮説", "".join(out), src=src.relative_to(ROOT), source=str(src.relative_to(ROOT)))


def specs_page(site, proj):
    src = proj / "log/specs.csv"
    with open(src, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    names = {"synthetic": "合成データ", "confirmatory": "確証", "exploratory": "探索"}
    count = {k: sum(r["stage"] == k for r in rows) for k in names}
    tiles = "".join(f'<div class="tile"><b>{v}</b><span>{names[k]}</span></div>' for k, v in count.items())
    cols = ["spec_id", "timestamp", "hypothesis", "stage", "outcome", "estimand", "sample", "n", "n_clusters", "estimate", "se", "ci_low", "ci_high", "note"]
    body = (f"<h1>走らせた推定の全記録</h1><p class='lead'>全 {len(rows)} 本。載せなかった推定も、有意でなかった推定も、ここに残る。</p>"
            f'<div class="tiles">{tiles}</div>' + csv_table(rows, cols, "specs"))
    return site.add(f"{proj.name}/specs.html", "推定の記録", body, src=src.relative_to(ROOT), source=str(src.relative_to(ROOT)), cls="wide")


def video_page(site, base, name):
    """<base>/video/ を丸ごとコピーし、プレイヤーを埋め込むページを作る。"""
    vdir = base / "video"
    shutil.copytree(vdir, DIST / name / "video", dirs_exist_ok=True)
    if (base / "paper/figs").is_dir():
        shutil.copytree(base / "paper/figs", DIST / name / "paper/figs", dirs_exist_ok=True)
    vids = []
    for js in sorted((vdir / "videos").glob("*.js")):
        t = js.read_text(encoding="utf-8")
        m = {k: re.search(rf"\b{k}\s*:\s*(['\"])(.*?)\1", t) for k in ("id", "title", "subtitle")}
        if m["id"] and m["title"]:
            vids.append((m["id"].group(2), m["title"].group(2), m["subtitle"].group(2) if m["subtitle"] else ""))
    items = "".join(f'<li><a href="video/index.html#{esc(i)}" target="player"><b>{esc(t)}</b></a>　{esc(s)}</li>' for i, t, s in vids)
    body = (f"<h1>動画</h1><p class='lead'>図と字幕で内容をつかむ。再生ボタンを押すと始まる。読み上げは切り替えられる。</p>"
            f'<div class="video"><iframe name="player" src="video/index.html" title="動画プレイヤー" allow="autoplay"></iframe></div>'
            f'<ul class="videolist">{items}</ul><p><a href="video/index.html">プレイヤーだけを開く</a></p>')
    return site.add(f"{name}/video.html", "動画", body, source=f"{name}/video/videos/*.js", cls="wide")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets").mkdir(parents=True)
    for f in (ROOT / "portal/assets").iterdir():
        shutil.copy2(f, DIST / "assets" / f.name)
    site = Site()

    print("ラボ")
    lab = [md_page(site, ROOT / "README.md", "index.html", title="はじめに")]
    if (ROOT / "common/video").is_dir():
        shutil.copytree(ROOT / "common/video", DIST / "common/video", dirs_exist_ok=True)
    if (ROOT / "guide/video/index.html").exists():
        t, o = video_page(site, ROOT / "guide", "guide")
        lab.append(("動画で見る", o))
    for name, title in (("AGENTS.md", "研究のまとめ方"), ("ETHICS.md", "倫理規定"), ("DECISIONS.md", "人が決めること")):
        if (ROOT / name).exists():
            lab.append(md_page(site, ROOT / name, f"lab/{name[:-3].lower()}.html", title=title))
    site.nav.append(("ラボ", lab))

    print("文献")
    site.nav.append(("文献", [literature_page(site), md_page(site, ROOT / "literature/README.md", "literature/howto.html", title="表の書式と手順")]))

    print("テーマ選定")
    th = [themes_page(site)]
    for src in tex_docs(ROOT / "theme"):
        th.append(tex_page(site, src, "theme/" + ("index" if src.parent.name == "paper" else src.parent.name) + ".html",
                           label="テーマをどう選ぶか" if src.parent.name == "paper" else None))
    th.append(md_page(site, ROOT / "theme/research/00_plan.md", "theme/plan.html", title="採点の手順"))
    if (ROOT / "theme/research/axes_review.md").exists():
        th.append(md_page(site, ROOT / "theme/research/axes_review.md", "theme/axes_review.html", title="軸の見直し（調査と提案）"))
    if (ROOT / "theme/research/sources.md").exists():
        th.append(md_page(site, ROOT / "theme/research/sources.md", "theme/sources.html", title="出典の照合記録"))
    site.nav.append(("1. テーマ選定", th))

    dd = [md_page(site, ROOT / "deepdive/README.md", "deepdive/index.html", title="ディープダイブとは")]
    for src in sorted((ROOT / "deepdive").glob("T*.md")):
        dd.append(md_page(site, src, f"deepdive/{src.stem}.html"))
    site.nav.append(("2. ディープダイブ", dd))

    for proj in projects():
        print(proj.name)
        items = [md_page(site, proj / "README.md", f"{proj.name}/index.html", title="入口")]
        for src in tex_docs(proj):
            name = "note" if src.parent.name == "paper" else src.parent.name
            items.append(tex_page(site, src, f"{proj.name}/{name}.html", label="研究ノート" if name == "note" else None))
        if (proj / "hypotheses/hypotheses.json").exists():
            items.append(hypotheses_page(site, proj))
        if (proj / "log/specs.csv").exists():
            items.append(specs_page(site, proj))
        if (proj / "video/index.html").exists():
            items.append(video_page(site, proj, proj.name))
        for src in sorted((proj / "research").glob("audit-*.md")) if (proj / "research").is_dir() else []:
            items.append(md_page(site, src, f"{proj.name}/{src.stem}.html"))
        site.nav.append((first_heading(proj / "README.md"), items))

    site.write()
    print(f"{len(site.pages)} ページを {DIST} に書いた。変換警告 {len(warnings)} 件。")
    sys.exit(1 if warnings else 0)


if __name__ == "__main__":
    main()
