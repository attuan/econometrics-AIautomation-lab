// 動画のシーンを書くための共通部品。舞台は viewBox 0 0 1600 900 の SVG。
// 規約は STYLE.md。このファイルと player.js / style.css は、動画ごとには編集しない。
'use strict';
const SVGNS = 'http://www.w3.org/2000/svg';

// 色。意味は STYLE.md「色の意味」に固定する。
const C = {
  bg: '#101827', panel: '#1a2538', line: '#33415c', ink: '#eef2f9', mute: '#93a1bb',
  blue: '#5aa9ff',    // 処置群・主役・強調
  gray: '#7c8aa5',    // 対照群・比較の相手
  green: '#58d08a',   // 確証・支持・成功
  yellow: '#ffd24a',  // 探索・まだ確かめていないこと
  red: '#ff6470',     // 問題点・棄却・やってはいけないこと
  purple: '#b592ff',  // AI・計算・シミュレーション
  orange: '#ff9d47',  // 人の判断（関門）・ロック
  cyan: '#3fd3cf',    // データ・文献
};

// ---------- 基本 ----------
function set(n, attrs) {
  for (const k of Object.keys(attrs)) {
    if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
  }
  return n;
}
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  set(n, attrs);
  if (parent) parent.appendChild(n);
  return n;
}
// 固定の transform を持つグループ。show() はこの transform を保ったまま動かす。
function grp(parent, transform = '') {
  const g = el('g', transform ? { transform } : {}, parent);
  g.__base = transform;
  return g;
}
// 文字。'\n' で改行。複数行は (x, y) を中心に縦に並ぶ。既定は中央揃え・32px。
// 1行なら <text>、複数行なら <text> を束ねた <g> を返す（どちらも show() に渡せる）。
// 縦の中央合わせは y に 0.36em を足して行う（dominant-baseline や tspan の dy は描画系ごとに差が出る）。
function txt(parent, x, y, s, o = {}) {
  const size = o.size || 32, lh = o.lh || size * 1.4, lines = String(s).split('\n');
  const one = (p, ln, i) => el('text', {
    x, y: y + (i - (lines.length - 1) / 2) * lh + size * 0.36, fill: o.fill || C.ink, 'font-size': size,
    'text-anchor': o.anchor || 'middle', 'font-weight': o.weight || 500, text: ln,
  }, p);
  if (lines.length === 1) return one(parent, lines[0], 0);
  const g = el('g', {}, parent);
  lines.forEach((ln, i) => one(g, ln, i));
  return g;
}
// 画像（<project>/paper/figs などの自作図）。外部 URL は使わない。
function img(parent, href, x, y, w, h, o = {}) {
  return el('image', { href, x, y, width: w, height: h, preserveAspectRatio: o.fit || 'xMidYMid meet' }, parent);
}

// ---------- 時間 ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = p => p * p * (3 - 2 * p);
// 時刻 a から d 秒かけて 0→1 になる進み具合（なめらか）
const prog = (t, a, d = 1) => smooth(clamp((t - a) / d));
// 時刻 a で現れ（下から少し浮き上がる）、時刻 b で消える。戻り値は不透明度。
function show(n, t, a, b = Infinity, d = 0.5) {
  const p = Math.min(prog(t, a, d), 1 - prog(t, b, d));
  n.setAttribute('opacity', p);
  n.setAttribute('transform', `${n.__base || ''} translate(0 ${(1 - p) * 16})`.trim());
  return p;
}
// 不透明度だけを変える（話し終えた要素を薄くするときに使う）
function dim(n, t, a, to = 0.3, d = 0.5) {
  const cur = Number(n.getAttribute('opacity') || 1);
  n.setAttribute('opacity', Math.min(cur, lerp(1, to, prog(t, a, d))));
}
// 位置が種で決まる乱数（シークしても同じ絵になるように、setup の中で使う）
function rng(seed = 1) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

// ---------- 線と矢印 ----------
// 矢印。drawLine(矢印, p) で根元から先へ伸ばせる。o: {color, width, curve:[cx,cy], d, dash, head}
function arrow(parent, x1, y1, x2, y2, o = {}) {
  const color = o.color || C.ink, w = o.width || 4, h = o.head || w * 4;
  const d = o.d || (o.curve ? `M${x1},${y1} Q${o.curve[0]},${o.curve[1]} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`);
  const g = grp(parent);
  const path = el('path', { d, stroke: color, 'stroke-width': w, fill: 'none' }, g);
  if (o.dash) path.setAttribute('stroke-dasharray', o.dash);
  const head = el('path', { d: `M0,0 L${-h},${-h * 0.5} L${-h},${h * 0.5} Z`, fill: color }, g);
  g.__path = path; g.__head = head; g.__h = h; g.__dashed = !!o.dash;
  drawLine(g, 1);
  return g;
}
// 線を p (0..1) の所まで描く。arrow() の戻り値にも、ただの path にも使える。
function drawLine(n, p) {
  const path = n.__path || n;
  const L = path.__len || (path.__len = path.getTotalLength());
  p = clamp(p);
  if (n.__path) {
    const a = path.getPointAtLength(L * p), b = path.getPointAtLength(Math.max(0, L * p - 2));
    const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
    n.__head.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
    if (!n.__dashed) path.setAttribute('stroke-dasharray', `${Math.max(0, L * p - n.__h * 0.6)} ${L + 10}`);
    n.setAttribute('opacity', p > 0.02 ? 1 : 0);
  } else {
    path.setAttribute('stroke-dasharray', `${L * p} ${L + 10}`);
    path.setAttribute('opacity', p > 0 ? 1 : 0);
  }
}

// ---------- 箱・見出し・軸 ----------
// 角丸の箱と中央のラベル。o: {fill, stroke, sw, rx, size, color, weight}
function box(parent, x, y, w, h, label, o = {}) {
  const g = grp(parent);
  el('rect', { x, y, width: w, height: h, rx: o.rx == null ? 16 : o.rx, fill: o.fill || C.panel,
    stroke: o.stroke || C.line, 'stroke-width': o.sw || 3 }, g);
  if (label) txt(g, x + w / 2, y + h / 2, label, { size: o.size || 30, fill: o.color || C.ink, weight: o.weight });
  return g;
}
// シーンの見出し（左上の決まった位置）。主張の形で書く。
function heading(parent, s, sub) {
  const g = grp(parent);
  el('rect', { x: 60, y: 50, width: 8, height: 54, rx: 4, fill: C.blue }, g);
  txt(g, 90, 77, s, { size: 44, weight: 800, anchor: 'start' });
  if (sub) txt(g, 92, 130, sub, { size: 26, fill: C.mute, anchor: 'start' });
  return g;
}
// 小さなグラフの軸。戻り値の X(v), Y(v) がデータ値を画面の座標に変える。
function axes(parent, x, y, w, h, xr, yr, o = {}) {
  const g = grp(parent);
  el('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: C.mute, 'stroke-width': 3 }, g);
  el('line', { x1: x, y1: y, x2: x, y2: y + h, stroke: C.mute, 'stroke-width': 3 }, g);
  if (o.xlabel) txt(g, x + w / 2, y + h + 38, o.xlabel, { size: 24, fill: C.mute });
  if (o.ylabel) txt(g, x, y - 28, o.ylabel, { size: 24, fill: C.mute, anchor: 'start' });
  const X = v => x + (v - xr[0]) / (xr[1] - xr[0]) * w, Y = v => y + h - (v - yr[0]) / (yr[1] - yr[0]) * h;
  return { g, X, Y };
}

// ---------- 経済学むけの共通部品（どの動画でも同じ形で使う） ----------
// 論文・文書
function paper(parent, x, y, s = 1, color = C.cyan) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('path', { d: 'M0,0 H62 L84,22 V112 H0 Z', fill: C.panel, stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M62,0 V22 H84', fill: 'none', stroke: color, 'stroke-width': 3 }, g);
  for (let i = 0; i < 4; i++) el('line', { x1: 14, x2: i === 3 ? 48 : 70, y1: 40 + i * 18, y2: 40 + i * 18, stroke: C.mute, 'stroke-width': 3 }, g);
  return g;
}
// データ表。戻り値 {g, rect[r][c], cx(c), cy(r)}。r=0 は見出し行。
function table(parent, x, y, cols, rows, cw, ch, o = {}) {
  const g = grp(parent), rect = [];
  for (let r = 0; r < rows; r++) {
    rect.push([]);
    for (let c = 0; c < cols; c++) {
      rect[r].push(el('rect', { x: x + c * cw, y: y + r * ch, width: cw, height: ch,
        fill: r === 0 ? (o.head || C.line) : C.panel, stroke: C.line, 'stroke-width': 2 }, g));
    }
  }
  return { g, rect, cx: c => x + c * cw + cw / 2, cy: r => y + r * ch + ch / 2 };
}
// 散布図の点。pts = [[x, y], ...]（データ値）。ax は axes() の戻り値。戻り値は円の配列。
function scatter(parent, ax, pts, color = C.blue, r = 9) {
  return pts.map(([px, py]) => el('circle', { cx: ax.X(px), cy: ax.Y(py), r, fill: color, opacity: 0.9 }, parent));
}
// 回帰直線など、データ座標の直線。drawLine() で伸ばせる。
function fitline(parent, ax, x1, y1, x2, y2, color = C.ink, w = 5) {
  return el('path', { d: `M${ax.X(x1)},${ax.Y(y1)} L${ax.X(x2)},${ax.Y(y2)}`, stroke: color, 'stroke-width': w, fill: 'none' }, parent);
}
// 点推定と信頼区間（横向き）。x0 が値 0 の位置、scale が値 1 あたりの画素数。
function coef(parent, x0, y, scale, est, lo, hi, color = C.blue) {
  const g = grp(parent);
  el('line', { x1: x0 + lo * scale, x2: x0 + hi * scale, y1: y, y2: y, stroke: color, 'stroke-width': 5 }, g);
  for (const v of [lo, hi]) el('line', { x1: x0 + v * scale, x2: x0 + v * scale, y1: y - 10, y2: y + 10, stroke: color, 'stroke-width': 5 }, g);
  el('circle', { cx: x0 + est * scale, cy: y, r: 11, fill: color, stroke: C.bg, 'stroke-width': 3 }, g);
  return g;
}
// 人が判断する関門（ひし形）
function gate(parent, x, y, r = 30, color = C.orange) {
  const g = grp(parent);
  el('path', { d: `M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z`, fill: color, stroke: C.bg, 'stroke-width': 3 }, g);
  return g;
}
// 鍵。setLock(g, p) で p=0（開）→ 1（閉）。
function lock(parent, x, y, s = 1, color = C.orange) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  g.__shackle = el('path', { d: 'M-24,0 V-26 A24,24 0 0 1 24,-26 V0', fill: 'none', stroke: color, 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
  el('rect', { x: -40, y: 0, width: 80, height: 62, rx: 10, fill: color }, g);
  el('circle', { cx: 0, cy: 26, r: 8, fill: C.bg }, g);
  el('rect', { x: -3.5, y: 28, width: 7, height: 18, rx: 3, fill: C.bg }, g);
  setLock(g, 1);
  return g;
}
function setLock(g, p) { g.__shackle.setAttribute('transform', `translate(0 ${-20 * (1 - clamp(p))})`); }
// 人
function person(parent, x, y, s = 1, color = C.orange) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('circle', { cx: 0, cy: -46, r: 26, fill: color }, g);
  el('path', { d: 'M-48,58 Q-48,-10 0,-10 Q48,-10 48,58 Z', fill: color }, g);
  return g;
}
// AI・計算機
function computer(parent, x, y, s = 1, label = 'AI', color = C.purple) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('rect', { x: -84, y: -62, width: 168, height: 108, rx: 12, fill: C.panel, stroke: color, 'stroke-width': 5 }, g);
  el('rect', { x: -22, y: 46, width: 44, height: 16, fill: color }, g);
  el('rect', { x: -58, y: 62, width: 116, height: 9, rx: 4, fill: color }, g);
  if (label) txt(g, 0, -8, label, { size: 46, weight: 800, fill: color });
  return g;
}
// ライブラリ（ソフトウェアの包み）
function pkg(parent, x, y, s = 1, color = C.purple) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('path', { d: 'M0,-64 L62,-34 V36 L0,66 L-62,36 V-34 Z', fill: C.panel, stroke: color, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M-62,-34 L0,-4 L62,-34 M0,-4 V66', fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  return g;
}
// 虫めがね（監査・点検）
function lens(parent, x, y, s = 1, color = C.purple) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('circle', { cx: 0, cy: 0, r: 34, fill: 'none', stroke: color, 'stroke-width': 9 }, g);
  el('line', { x1: 25, y1: 25, x2: 62, y2: 62, stroke: color, 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
  return g;
}
// チェックの印
function tick(parent, x, y, s = 1, color = C.green) {
  const g = grp(parent, `translate(${x} ${y}) scale(${s})`);
  el('path', { d: 'M-16,2 L-4,14 L18,-12', fill: 'none', stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  return g;
}

// ---------- 字幕の時刻を自動で割り振る ----------
// lines（字幕の文の配列）から、[開始秒, 文] の配列を作る。1文の表示時間は「文字数÷7」秒以上。
function timeline(lines, start = 0.8, gap = 0.5) {
  let t = start; const subs = [], T = [];
  for (const s of lines) {
    const at = Math.round(t * 10) / 10;
    subs.push([at, s]); T.push(at);
    t = at + Math.max(s.length / 7, 2.0) + gap;
  }
  return { subs, T, end: t };
}
// 1シーンを作る。build(g, T) の T[i] は i 番目の字幕が出る時刻。build は t => {...} を返す。
function scene(title, head, lines, build) {
  const { subs, T, end } = timeline(lines);
  return { title, dur: Math.ceil(end + 2.6), subs, setup(g) {
    el('rect', { width: 1600, height: 900, fill: C.bg }, g);
    heading(g, head);
    return build(g, T);
  } };
}
