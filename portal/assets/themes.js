// 星取り表。データは build.py が <script id="data"> に埋め込む。
// 主役は4群の点。15軸は「15軸を表示」か、行を押したときの詳細で見る。
// 軸に重みは付けない。重く見たい項目があれば、見出しを押してその項目で並べ替える。
// 群の点 = 軸の平均×20、合計 = 4群の点の幾何平均（tools/score_themes.py と同じ計算）。
(function () {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = id => document.getElementById(id);
  const MARK = { 5: '◎', 4: '○', 3: '△', 2: '▲', 1: '×' };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const GROUPS = [...new Set(D.axes.map(a => a.group))];
  let sortKey = 'total', track = '', selected = null, showAxes = false;   // sortKey: 'total' / 'g0'..'g3' / 軸の記号
  let picked = new Set();
  try { picked = new Set(JSON.parse(localStorage.getItem('picked') || '[]')); } catch (e) { /* 保存できない環境でも動く */ }

  function groupScores(t) {
    return GROUPS.map(g => {
      const as = D.axes.filter(a => a.group === g);
      return 20 * as.reduce((x, a) => x + t[a.id], 0) / as.length;
    });
  }
  const total = gs => Math.exp(gs.reduce((x, s) => x + Math.log(s), 0) / gs.length);
  const bar = s => `<span class="gbar" title="${s.toFixed(1)}"><i style="width:${Math.round((s - 20) / 0.8)}%"></i></span>`;
  const capped = (t, a) => (t.capped || '').split(' ').includes(a);
  const sortLabel = () => sortKey === 'total' ? '合計' : sortKey[0] === 'g' && sortKey.length === 2 ? GROUPS[+sortKey[1]] : (D.axes.find(a => a.id === sortKey) || {}).name;

  // 選ぶときの条件（上位10個の組合せ）
  function portfolio() {
    const ts = D.themes.filter(t => picked.has(t.id)), P = D.portfolio, out = [];
    if (!ts.length) return '';
    const by = (k) => ts.reduce((m, t) => (m[t[k]] = (m[t[k]] || 0) + 1, m), {});
    const designs = by('design'), tracks = by('track');
    const over = Object.entries(designs).filter(([, n]) => n > P.max_same_design);
    out.push([`${ts.length} / ${P.size} 個`, ts.length === P.size]);
    out.push([`同じ設計は ${P.max_same_design} 個まで` + (over.length ? `（超過: ${over.map(([d, n]) => `${d} ${n}個`).join('、')}）` : ''), !over.length]);
    const short = Object.keys(D.tracks).filter(k => (tracks[k] || 0) < P.min_per_track);
    out.push([`各トラックから ${P.min_per_track} 個以上` + (short.length ? `（不足: ${short.map(k => D.tracks[k]).join('、')}）` : ''), !short.length]);
    const dup = Object.entries(by('cluster')).filter(([, n]) => n > 1).map(([c]) => c);
    out.push(['似たテーマは1個にまとめる' + (dup.length ? `（同じ分類が複数: ${dup.join('、')}。人が見て判断）` : ''), !dup.length]);
    return '<b>候補: ' + esc([...picked].sort().join(', ')) + '</b><ul>' + out.map(([s, ok]) => `<li class="${ok ? 'ok' : 'ng'}">${ok ? '✓' : '△'} ${esc(s)}</li>`).join('') + '</ul>';
  }

  function render() {
    const val = r => sortKey === 'total' ? r.s : sortKey[0] === 'g' && sortKey.length === 2 ? r.g[+sortKey[1]] : r.t[sortKey];
    const rows = D.themes.filter(t => !track || t.track === track).map(t => { const g = groupScores(t); return { t, g, s: total(g) }; })
      .sort((a, b) => (val(b) - val(a)) || (b.s - a.s));
    const th = (key, label, cls, title) => `<th class="${cls} sortable${sortKey === key ? ' sorted' : ''}" data-sort="${key}" title="${esc(title || label)}で並べ替える">${esc(label)}${sortKey === key ? ' ▼' : ''}</th>`;
    let h = '<thead><tr><th>候補</th><th>順</th><th>型</th><th>テーマ</th>' + GROUPS.map((g, i) => th('g' + i, g, 'gh')).join('') + th('total', '合計', '')
      + (showAxes ? D.axes.map(a => th(a.id, a.id, 'ax', `${a.group}：${a.name}`)).join('') : '') + '</tr></thead><tbody>';
    rows.forEach(({ t, s, g }, i) => {
      const badges = (t.status === 'pilot' ? '<span class="badge pilot">試行</span>' : t.status === 'screened' ? '<span class="badge pilot">一次採点</span>' : '') + (t.capped ? `<span class="badge flag">根拠なし: ${esc(t.capped)}</span>` : '');
      h += `<tr data-id="${t.id}" class="${selected === t.id ? 'on' : ''}">`
        + `<td><input type="checkbox" aria-label="${t.id} を候補に入れる" ${picked.has(t.id) ? 'checked' : ''}></td><td class="num">${i + 1}</td>`
        + `<td>${esc(D.tracks[t.track] || t.track)}<br><span class="sub">${esc(t.design || '')}</span></td>`
        + `<td class="name"><b>${t.id}</b>　${esc(t.theme)}<br>${badges}</td>`
        + g.map(x => `<td class="gs"><b>${x.toFixed(0)}</b>${bar(x)}</td>`).join('')
        + `<td class="num total"><b>${s.toFixed(1)}</b></td>`
        + (showAxes ? D.axes.map(a => `<td class="m m${t[a.id]}" title="${esc(a.name)}: ${t[a.id]}${capped(t, a.id) ? '（根拠が無いので上限2）' : ''}">${MARK[t[a.id]]}${capped(t, a.id) ? '*' : ''}</td>`).join('') : '') + '</tr>';
    });
    $('hoshi').innerHTML = h + '</tbody>';
    $('sortnote').textContent = `並び順: ${sortLabel()}の高い順`;
    $('picked').innerHTML = portfolio();
    let w = '<thead><tr><th>群</th><th>軸</th></tr></thead><tbody>';
    for (const a of D.axes) w += `<tr><td>${esc(a.group)}</td><td><b>${a.id}</b>　${esc(a.name)}</td></tr>`;
    $('weights').innerHTML = w + '</tbody>';
    detail();
  }

  function detail() {
    const t = D.themes.find(x => x.id === selected), box = $('detail');
    if (!t) { box.hidden = true; return; }
    const gs = groupScores(t);
    const axes = GROUPS.map((g, i) => `<dt>${esc(g)}　<b>${gs[i].toFixed(0)}</b></dt><dd>` + D.axes.filter(a => a.group === g)
      .map(a => `<span class="axis"><span class="m${t[a.id]}">${MARK[t[a.id]]}</span> ${esc(a.name)}${capped(t, a.id) ? `（根拠なし。申告 ${esc(t['raw_' + a.id])} → 上限2）` : ''}</span>`).join('') + '</dd>').join('');
    const rows = [['一言でいうと', t.win_thesis], ['最初の6か月', t.first_project], ['主なリスク', t.risks], ['採点の根拠', t.rationale],
      ['いちばん近い既存研究との差', t.nearest || '未記入（新規性は上限2点で計算）'], ['データの確認', t.data_check || '未記入（データ入手性は上限2点で計算）'],
      ['想定する設計', t.design_type], ['データ', t.data_sources], ['競合', t.competitors], ['研究動向', t.lit_trend], ['分野（JEL）', t.field], ['出典', t.sources]];
    box.hidden = false;
    box.innerHTML = `<h2>${t.id}　${esc(t.theme)}</h2><p class="badges"><span class="badge">${esc(D.tracks[t.track] || t.track)}</span>`
      + `<span class="badge">合計 ${total(gs).toFixed(1)}</span></p><dl>`
      + axes + rows.filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('') + '</dl>';
  }

  $('tracks').innerHTML = [['', 'すべて'], ...Object.entries(D.tracks)].map(([k, v]) => `<button data-t="${k}" aria-pressed="${k === ''}">${esc(v)}</button>`).join('');
  $('tracks').onclick = e => {
    if (e.target.dataset.t === undefined) return;
    track = e.target.dataset.t;
    $('tracks').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === track));
    render();
  };
  $('showaxes').onchange = e => { showAxes = e.target.checked; if (!showAxes && sortKey.length === 1) sortKey = 'total'; render(); };
  $('hoshi').onclick = e => {
    const head = e.target.closest('th[data-sort]');
    if (head) { sortKey = head.dataset.sort; render(); return; }
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    if (e.target.matches('input')) {
      e.target.checked ? picked.add(tr.dataset.id) : picked.delete(tr.dataset.id);
      try { localStorage.setItem('picked', JSON.stringify([...picked])); } catch (err) { /* 保存できなくても続ける */ }
      $('picked').innerHTML = portfolio();
      return;
    }
    selected = tr.dataset.id; render();
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  $('copy').onclick = () => {
    const text = `テーマ候補: ${[...picked].sort().join(', ')}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    $('copied').textContent = 'コピーした → ' + text;
  };
  render();
})();
