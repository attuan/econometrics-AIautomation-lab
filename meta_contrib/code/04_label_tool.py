"""正解づけの画面（H23）を作る。左に題目と要旨、右で答えをボタンで入れる。

- 入力: data/derived/label_sheet.csv（02_split.py の出力）
- 出力: data/derived/label_tool.html（手元でだけ開く。git に入れない。公開ポータルにも載せない。要旨は再配布しないため）
- 答えはブラウザに自動保存される。終わったら画面の「CSV を書き出す」で
  label_sheet_<名前>_<日付>.csv を保存し、data/derived/ に置く。
- 手順と定義は research/labeling_protocol.md。
- 使い方: python3 code/04_label_tool.py && open data/derived/label_tool.html
"""
import csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 画面に出す定義（research/labeling_protocol.md の要約。定義を変えたら両方直す）
QUESTIONS = [
    {"id": "T", "label": "論文の種類", "kind": "type",
     "def": "主な貢献は何か。M 手法（推定量・検定・手続き）／A 応用（データから得た経済の知見）／T 理論（経済の理論モデル）／O その他（サーベイなど）。迷ったら要旨の最初の2文が何を約束しているかで決める。"},
    {"id": "C1", "label": "誤りを正す", "kind": "yn",
     "def": "多くの研究者が使う手法・慣行・仮定が、誤った結論（偏り・誤った有意・誤った解釈）を生みうることを示している。「効率が悪い」「遅い」だけなら いいえ。"},
    {"id": "X", "label": "小幅な拡張", "kind": "yn",
     "def": "確立した分析・手法を、ほぼそのまま新しい国・業種・期間・データに当てている。または仮定を1つ緩める・変数を1つ足す程度の変更。データだけが新しく、問いと方法が既存と同じなら はい。"},
    {"id": "C2", "label": "道具を作る", "kind": "yn",
     "def": "多くの研究者がさまざまな場面で使える、汎用の推定量・検定・手続き・ソフトウェアを提供している。特定の1つのモデル・データ専用なら いいえ。応用論文は原則 いいえ。"},
    {"id": "G", "label": "特定の国・地域・業種が対象", "kind": "yn",
     "def": "分析の対象として、特定の国・地域・都市・業種を名指ししている（手法論文の例示でも、OECD のような地域名でも はい）。「国のパネル」のように名指しが無ければ いいえ。"},
    {"id": "B", "label": "流行の題材を前面に出す", "kind": "yn",
     "def": "題目か要旨の1文目で、暗号資産・ブロックチェーン・COVID-19・ESG・気候金融・ビッグデータ・AI や機械学習の宣伝的な使い方を前面に出している。機械学習の手法そのものを研究対象として扱うなら いいえ。末尾で一言触れるだけなら いいえ。"},
    {"id": "S1", "label": "理論の保証", "kind": "yn", "only": "M",
     "def": "一致性・漸近正規性・妥当性・最適性など、手法の性質の理論的な結果を要旨で述べている。"},
    {"id": "S2", "label": "実データでの応用", "kind": "yn", "only": "M",
     "def": "実データに当てて手法を示している（要旨に書かれていれば）。"},
    {"id": "S3", "label": "シミュレーション", "kind": "yn", "only": "M",
     "def": "モンテカルロ実験・シミュレーションで性能を評価している（要旨に書かれていれば）。"},
]

TEMPLATE = r"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>正解づけ（H23）</title>
<style>
:root{--bg:#f7f7f5;--panel:#fff;--ink:#1d1d1b;--muted:#6b6b66;--line:#deddd8;--accent:#2f5d8a;--accent-ink:#fff;--yes:#2e7d4f;--no:#9a3b30;--q:#8a6d1f;--done:#e7f0e9}
@media (prefers-color-scheme:dark){:root{--bg:#171716;--panel:#22221f;--ink:#ecebe6;--muted:#a3a29b;--line:#3a3935;--accent:#7fb0de;--accent-ink:#111;--yes:#6cc28f;--no:#e08a7f;--q:#d9b65c;--done:#24352a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
header{display:flex;gap:12px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--panel);position:sticky;top:0;z-index:2;flex-wrap:wrap}
header b{font-size:15px}.grow{flex:1}
button{font:inherit;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer}
button:hover{border-color:var(--accent)}button.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
input[type=text]{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);width:9em}
main{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;padding:16px;max-width:1400px;margin:0 auto}
@media (max-width:900px){main{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
#left{position:sticky;top:64px;align-self:start;max-height:calc(100vh - 80px);overflow:auto}
#title{font-size:19px;line-height:1.5;margin:0 0 12px}#abstract{font-size:16px;line-height:1.85;white-space:pre-wrap;margin:0}
.meta{color:var(--muted);font-size:13px;margin-bottom:8px}
.q{padding:12px 0;border-bottom:1px solid var(--line)}.q:last-child{border-bottom:0}
.qh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.qh .name{font-weight:600;min-width:11em}
.opts{display:flex;gap:6px;flex-wrap:wrap}.opts button{min-width:4.2em}
.opts button.sel.y{background:var(--yes);border-color:var(--yes);color:#fff}
.opts button.sel.n{background:var(--no);border-color:var(--no);color:#fff}
.opts button.sel.u{background:var(--q);border-color:var(--q);color:#fff}
.opts button.sel.t{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.def{color:var(--muted);font-size:13px;margin-top:4px}
.key{font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:4px;padding:0 4px;margin-left:2px}
.hidden{display:none}textarea{width:100%;min-height:56px;font:inherit;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink)}
#grid{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}#grid button{min-width:2.6em;padding:2px 6px;font-size:12px}
#grid button.done{background:var(--done)}#grid button.cur{outline:2px solid var(--accent)}
.status{font-size:13px;color:var(--muted)}
</style></head><body>
<header>
  <b>正解づけ（H23）</b>
  <label class="status">名前 <input id="who" type="text" placeholder="例: attuan"></label>
  <span class="status" id="prog"></span>
  <span class="grow"></span>
  <button id="prev">← 前</button><button id="next" class="primary">次 →</button>
  <button id="export">CSV を書き出す</button>
  <label class="status"><input id="imp" type="file" accept=".csv" class="hidden"><button id="impbtn" type="button">CSV を読み込む</button></label>
</header>
<main>
  <section class="card" id="left">
    <div class="meta" id="pos"></div>
    <h1 id="title"></h1>
    <p id="abstract"></p>
  </section>
  <section class="card" id="right">
    <div id="qs"></div>
    <div class="q"><div class="qh"><span class="name">知っている論文</span>
      <div class="opts"><button data-k="known" data-v="1" class="kb">知っている</button></div></div>
      <div class="def">著者や雑誌を思い出せるなら押す（その論文を外した集計も出す）。</div></div>
    <div class="q"><div class="name" style="font-weight:600">メモ</div><textarea id="memo" placeholder="迷った理由など"></textarea></div>
    <div class="status">キー操作: 1＝はい 0＝いいえ /＝? を、上から順に未回答の問いへ入れる。M A T O で種類。→ ← で移動。答えはこのブラウザに自動保存される。</div>
    <div id="grid"></div>
  </section>
</main>
<script>
const PAPERS = __PAPERS__;
const QS = __QUESTIONS__;
const COLS = ["T","C1","X","C2","G","B","S1","S2","S3","known","memo"];
const STORE = "h23-labels-v1";
let st = {i:0, who:"", a:{}};
try { const s = JSON.parse(localStorage.getItem(STORE)||"null"); if (s) st = Object.assign(st, s); } catch(e) {}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(st)); }catch(e){} }
const $ = s => document.querySelector(s);
function ans(){ const id = PAPERS[st.i].openalex_id; return st.a[id] || (st.a[id] = {}); }
function active(q, a){ return !q.only || a.T === q.only; }
function complete(id){ const a = st.a[id]||{}; return QS.every(q => !active(q,a) || (a[q.id]!==undefined && a[q.id]!=="")); }
function render(){
  const p = PAPERS[st.i], a = ans();
  $("#pos").textContent = `${st.i+1} / ${PAPERS.length}`;
  $("#title").textContent = p.title; $("#abstract").textContent = p.abstract;
  const qs = $("#qs"); qs.innerHTML = "";
  for (const q of QS) {
    if (!active(q,a)) continue;
    const d = document.createElement("div"); d.className = "q";
    const opts = q.kind === "type"
      ? [["M","手法","t"],["A","応用","t"],["T","理論","t"],["O","その他","t"]]
      : [["1","はい","y"],["0","いいえ","n"],["?","?","u"]];
    d.innerHTML = `<div class="qh"><span class="name">${q.label}${q.only?' <span class="status">（手法論文のみ）</span>':''}</span><div class="opts"></div></div><div class="def">${q.def}</div>`;
    const o = d.querySelector(".opts");
    for (const [v,lab,cls] of opts) {
      const b = document.createElement("button"); b.textContent = lab; b.className = cls + (a[q.id]===v?" sel":"");
      b.onclick = () => { a[q.id] = (a[q.id]===v ? "" : v); if (q.id==="T" && v!=="M") { delete a.S1; delete a.S2; delete a.S3; } save(); render(); };
      o.appendChild(b);
    }
    qs.appendChild(d);
  }
  const kb = document.querySelector(".kb"); kb.classList.toggle("sel", a.known==="1"); kb.classList.toggle("t", true);
  kb.onclick = () => { a.known = a.known==="1" ? "" : "1"; save(); render(); };
  $("#memo").value = a.memo || "";
  const done = PAPERS.filter(p => complete(p.openalex_id)).length;
  $("#prog").textContent = `回答済み ${done} / ${PAPERS.length}`;
  const g = $("#grid"); g.innerHTML = "";
  PAPERS.forEach((p,k) => { const b = document.createElement("button"); b.textContent = k+1;
    b.className = (complete(p.openalex_id)?"done ":"") + (k===st.i?"cur":""); b.onclick = () => go(k); g.appendChild(b); });
  $("#who").value = st.who || "";
}
function go(k){ st.i = Math.max(0, Math.min(PAPERS.length-1, k)); save(); render(); window.scrollTo(0,0); $("#left").scrollTop = 0; }
$("#prev").onclick = () => go(st.i-1); $("#next").onclick = () => go(st.i+1);
$("#memo").oninput = e => { ans().memo = e.target.value; save(); };
$("#who").oninput = e => { st.who = e.target.value.trim(); save(); };
document.addEventListener("keydown", e => {
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
  const a = ans();
  if (e.key === "ArrowRight") return go(st.i+1);
  if (e.key === "ArrowLeft") return go(st.i-1);
  const k = e.key.toUpperCase();
  if (["M","A","T","O"].includes(k)) { a.T = k; if (k!=="M") { delete a.S1; delete a.S2; delete a.S3; } save(); return render(); }
  const map = {"1":"1","0":"0","/":"?","?":"?"};
  if (map[e.key] !== undefined) {
    const q = QS.find(q => q.kind==="yn" && active(q,a) && (a[q.id]===undefined || a[q.id]===""));
    if (q) { a[q.id] = map[e.key]; save(); render(); }
  }
});
function csvCell(v){ v = (v===undefined||v===null) ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v; }
$("#export").onclick = () => {
  const rows = [["openalex_id", ...COLS].join(",")];
  for (const p of PAPERS) { const a = st.a[p.openalex_id] || {}; rows.push([p.openalex_id, ...COLS.map(c => a[c])].map(csvCell).join(",")); }
  const blob = new Blob(["﻿" + rows.join("\n") + "\n"], {type:"text/csv"});
  const d = new Date(), ymd = d.getFullYear() + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0");
  const el = document.createElement("a"); el.href = URL.createObjectURL(blob);
  el.download = `label_sheet_${st.who || "noname"}_${ymd}.csv`; el.click();
};
$("#impbtn").onclick = () => $("#imp").click();
$("#imp").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const lines = (await f.text()).replace(/^﻿/,"").split(/\r?\n/).filter(Boolean);
  const parse = l => { const out=[]; let cur="", q=false; for (let i=0;i<l.length;i++){ const c=l[i];
    if (q) { if (c==='"' && l[i+1]==='"') { cur+='"'; i++; } else if (c==='"') q=false; else cur+=c; }
    else if (c===',') { out.push(cur); cur=""; } else if (c==='"') q=true; else cur+=c; } out.push(cur); return out; };
  const head = parse(lines[0]);
  for (const l of lines.slice(1)) { const r = parse(l), o = {}; head.forEach((h,k) => o[h] = r[k]);
    const a = st.a[o.openalex_id] = {}; for (const c of COLS) if (o[c]) a[c] = o[c]; }
  save(); render();
};
render();
</script></body></html>
"""


def main():
    rows = list(csv.DictReader(open(ROOT / "data/derived/label_sheet.csv")))
    papers = [{"openalex_id": r["openalex_id"], "title": r["title"], "abstract": r["abstract"]} for r in rows]
    js = lambda x: json.dumps(x, ensure_ascii=False).replace("</", "<\\/")
    html = TEMPLATE.replace("__PAPERS__", js(papers)).replace("__QUESTIONS__", js(QUESTIONS))
    out = ROOT / "data/derived/label_tool.html"
    out.write_text(html)
    print(f"{out} を書いた（{len(papers)} 本）。open で開く。")


if __name__ == "__main__":
    main()
