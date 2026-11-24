// 動画プレイヤー。videos/<ID>.js が VIDEO({...}) で登録した動画を、読み込んだ順に連続再生する。
// index.html は lib.js → player.js → videos/*.js の順に読むだけでよい（画面の部品はここで作る）。
//   <body data-series="タイトルカード上段の文言">
//   URL: #<ID> でその動画を開く。?t=<秒> で開始位置、?scene=<番号> でシーン頭出し（0 はタイトルカード）、
//        ?bare=1 でサイドバーと操作バーを隠す（埋め込み・画面の確認用）。
'use strict';
const VIDEOS = [];
function VIDEO(v) { VIDEOS.push(v); }

(function () {
  const TITLE_DUR = 6, HOLD_MAX = 6000;
  let vi = 0, t = 0, playing = false, speed = 1, speak = true;
  let built = -1, update = null, shownSub = null, last = 0, holdFrom = 0;
  const ui = {};

  const total = v => v.scenes.reduce((a, s) => a + s.dur, 0);
  const startOf = (v, i) => v.scenes.slice(0, i).reduce((a, s) => a + s.dur, 0);
  function locate(v, tt) {
    let a = 0;
    for (let i = 0; i < v.scenes.length; i++) {
      const d = v.scenes[i].dur;
      if (tt < a + d || i === v.scenes.length - 1) return { i, lt: Math.min(tt - a, d) };
      a += d;
    }
  }
  const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  const tts = () => (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);
  const hush = () => { const s = tts(); if (s) s.cancel(); };

  function titleCard(v, k, series) {
    return { title: 'タイトル', dur: TITLE_DUR, subs: v.hook ? [[0.6, v.hook]] : [], setup(g) {
      el('rect', { width: 1600, height: 900, fill: C.bg }, g);
      const top = VIDEOS.length > 1 ? `${series}  ${k + 1} / ${VIDEOS.length}` : series;
      const a = txt(g, 800, 290, top, { size: 34, fill: C.mute });
      const b = txt(g, 800, 420, v.title, { size: 72, weight: 800 });
      const c = txt(g, 800, 545, v.subtitle || '', { size: 38, fill: C.yellow });
      const bar = el('rect', { x: 800, y: 620, width: 0, height: 6, rx: 3, fill: C.blue }, g);
      return tt => {
        show(a, tt, 0); show(b, tt, 0.3); show(c, tt, 0.8);
        const p = prog(tt, 1, 1.2); set(bar, { x: 800 - 300 * p, width: 600 * p });
      };
    } };
  }

  function buildScene(i) {
    built = i;
    while (ui.stage.firstChild) ui.stage.removeChild(ui.stage.firstChild);
    const root = el('g', {}, ui.stage);
    try { update = VIDEOS[vi].scenes[i].setup(root) || (() => {}); }
    catch (e) {
      console.error(VIDEOS[vi].id, 'scene', i, e); update = () => {};
      txt(root, 800, 450, 'シーンのエラー: ' + e.message, { fill: C.red });
    }
    ui.list.querySelectorAll('.s').forEach(n => n.classList.toggle('on', +n.dataset.v === vi && +n.dataset.s === i));
  }

  function render() {
    const v = VIDEOS[vi], { i, lt } = locate(v, t);
    if (i !== built) buildScene(i);
    try { update(lt); } catch (e) { console.error(v.id, 'scene', i, e); update = () => {}; }
    let s = '';
    for (const [at, str] of v.scenes[i].subs || []) if (lt >= at) s = str;
    if (s !== shownSub) {
      shownSub = s;
      ui.sub.textContent = ''; if (s) { const sp = document.createElement('span'); sp.textContent = s; ui.sub.appendChild(sp); }
      const syn = tts();
      if (syn && speak && playing && s) {
        syn.cancel();
        const u = new SpeechSynthesisUtterance(s); u.lang = 'ja-JP'; u.rate = 1.1 * speed; syn.speak(u);
      }
    }
    ui.seek.value = t / total(v) * 1000;
    ui.time.textContent = `${fmt(t)} / ${fmt(total(v))}`;
  }

  function tick(now) {
    if (playing) {
      let nt = t + Math.min(0.1, (now - last) / 1000) * speed;
      // 読み上げが終わっていなければ、次の字幕（またはシーンの終わり）の手前で少し待つ
      const syn = tts();
      if (syn && speak && syn.speaking) {
        const v = VIDEOS[vi], { i, lt } = locate(v, t);
        const nx = (v.scenes[i].subs || []).find(([at]) => at > lt);
        const edge = startOf(v, i) + (nx ? nx[0] : v.scenes[i].dur);
        if (nt >= edge) { holdFrom = holdFrom || now; if (now - holdFrom < HOLD_MAX) nt = Math.max(t, edge - 0.001); }
        else holdFrom = 0;
      } else holdFrom = 0;
      t = nt;
      if (t >= total(VIDEOS[vi])) {
        if (vi < VIDEOS.length - 1) open(vi + 1, 0); else { t = total(VIDEOS[vi]); setPlay(false); }
      }
    }
    last = now; render(); requestAnimationFrame(tick);
  }

  function open(k, tt = 0) {
    vi = clamp(k, 0, VIDEOS.length - 1); t = clamp(tt, 0, total(VIDEOS[vi])); built = -1; shownSub = null; holdFrom = 0;
    ui.list.querySelectorAll('.v').forEach(n => n.classList.toggle('on', +n.dataset.v === vi));
    try { history.replaceState(null, '', location.pathname + location.search + '#' + VIDEOS[vi].id); } catch (e) { /* file:// など */ }
  }
  function setPlay(p) {
    playing = p; ui.play.textContent = p ? '❚❚ 一時停止' : '▶ 再生';
    if (!p) hush(); else { shownSub = null; if (t >= total(VIDEOS[vi])) t = 0; }
  }
  function jump(d) {
    const v = VIDEOS[vi], n = locate(v, t).i + d;
    hush();
    if (n < 0) return vi > 0 ? open(vi - 1, startOf(VIDEOS[vi - 1], VIDEOS[vi - 1].scenes.length - 1)) : open(0, 0);
    if (n >= v.scenes.length) return vi < VIDEOS.length - 1 ? open(vi + 1, 0) : undefined;
    t = startOf(v, n); shownSub = null;
  }

  function init() {
    const series = document.body.dataset.series || document.title || '';
    document.body.insertAdjacentHTML('beforeend', `
      <nav id="side"><h1></h1><div id="list"></div></nav>
      <main id="main">
        <div id="screen">
          <svg id="stage" viewBox="0 0 1600 900" font-family="'Hiragino Sans','Noto Sans JP',sans-serif"></svg>
          <div id="sub"></div>
        </div>
        <div id="bar">
          <button id="prev" title="前のシーン（←）">⏮</button>
          <button id="play" title="再生／一時停止（Space）">▶ 再生</button>
          <button id="next" title="次のシーン（→）">⏭</button>
          <input id="seek" type="range" min="0" max="1000" value="0" aria-label="再生位置">
          <span id="time"></span>
          <select id="speed" aria-label="速度">
            <option value="0.75">0.75x</option><option value="1" selected>1x</option>
            <option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option>
          </select>
          <label><input id="tts" type="checkbox" checked> 読み上げ</label>
        </div>
      </main>`);
    for (const id of ['side', 'list', 'stage', 'sub', 'play', 'prev', 'next', 'seek', 'time', 'speed', 'tts']) ui[id] = document.getElementById(id);
    ui.side.querySelector('h1').textContent = series;

    const q = new URLSearchParams(location.search);
    if (q.get('bare')) document.body.classList.add('bare');
    if (!VIDEOS.length) { ui.sub.textContent = '動画が登録されていない（videos/*.js を index.html で読み込む）'; return; }

    VIDEOS.forEach((v, k) => v.scenes.unshift(titleCard(v, k, series)));
    VIDEOS.forEach((v, k) => {
      const d = document.createElement('div'); d.className = 'v'; d.dataset.v = k;
      d.textContent = (VIDEOS.length > 1 ? `${k + 1}. ` : '') + v.title;
      d.onclick = () => { hush(); open(k, 0); };
      ui.list.appendChild(d);
      v.scenes.forEach((s, i) => {
        if (!i) return;
        const n = document.createElement('div'); n.className = 's'; n.dataset.v = k; n.dataset.s = i;
        n.textContent = s.title || `シーン ${i}`;
        n.onclick = () => { hush(); open(k, startOf(v, i)); };
        ui.list.appendChild(n);
      });
    });

    ui.play.onclick = () => setPlay(!playing);
    ui.prev.onclick = () => jump(-1);
    ui.next.onclick = () => jump(1);
    ui.speed.onchange = e => { speed = +e.target.value; };
    ui.tts.onchange = e => { speak = e.target.checked; if (!speak) hush(); };
    ui.seek.oninput = e => { t = e.target.value / 1000 * total(VIDEOS[vi]); shownSub = null; hush(); };
    document.addEventListener('keydown', e => {
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.code === 'Space') return;
      if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
      if (e.code === 'ArrowRight') jump(1);
      if (e.code === 'ArrowLeft') jump(-1);
    });
    const fromHash = () => VIDEOS.findIndex(v => '#' + v.id === location.hash);
    window.addEventListener('hashchange', () => { const h = fromHash(); if (h >= 0 && h !== vi) { hush(); open(h, 0); } });

    const h = Math.max(0, fromHash());
    let t0 = 0;
    if (q.get('scene') != null) t0 = startOf(VIDEOS[h], clamp(+q.get('scene') || 0, 0, VIDEOS[h].scenes.length - 1));
    if (q.get('t') != null) t0 += +q.get('t') || 0;
    open(h, t0);
    render();
    requestAnimationFrame(tick);
  }

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
})();
