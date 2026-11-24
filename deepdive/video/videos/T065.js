// T065 需要推定の操作変数の診断と、弱いときの推論 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T065.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
// 判断そのものは書かない（人が decision 箱・10章に書く）。点検: tools/check_video.sh deepdive/video
(() => {
  // 共通の小部品：札（左に色の帯）
  function card(g, x, y, w, h, title, body, col) {
    const n = grp(g);
    el('rect', { x, y, width: w, height: h, rx: 16, fill: C.panel, stroke: col, 'stroke-width': 3 }, n);
    el('rect', { x, y, width: 12, height: h, rx: 6, fill: col }, n);
    txt(n, x + 36, y + (body ? 48 : h / 2), title, { size: 32, weight: 700, anchor: 'start' });
    if (body) txt(n, x + 36, y + 102 + (body.split('\n').length - 1) * 18.2, body, { size: 26, fill: C.mute, anchor: 'start' });
    return n;
  }
  const tag = (g, s) => txt(g, 1540, 150, s, { size: 24, fill: C.mute, anchor: 'end' });

  VIDEO({
    id: 'T065', title: '需要推定の弱い操作変数', subtitle: '弱いとき、信頼区間は正しいか',
    hook: '定番のライブラリに、まだ無い道具を作ります。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '操作変数が弱いと、区間がうそをつく', [
        'テーマは、需要推定の信頼区間です。',
        '価格の効果を測るには、操作変数を使います。',
        '操作変数が弱いと、普通の区間は狭すぎるかもしれません。',
        'そこで、弱いかどうかを診断します。',
        '弱くても正しい区間を、実用的な時間で出せるか。それが問いです。',
      ], (g, T) => {
        const zv = box(g, 140, 300, 260, 110, '操作変数', { size: 34, stroke: C.cyan });
        const pv = box(g, 560, 300, 220, 110, '価格', { size: 34 });
        const qv = box(g, 940, 300, 220, 110, '需要', { size: 34 });
        const a1 = arrow(g, 405, 355, 552, 355, { color: C.cyan, width: 5 });
        const a2 = arrow(g, 785, 355, 932, 355, { color: C.ink, width: 5 });
        const term = box(g, 140, 470, 1020, 80, '操作変数 = 価格だけを外から動かす力', { size: 30, stroke: C.mute, color: C.mute });
        // 区間の比較（模式図）
        const ex = tag(g, '例（架空の模式図）');
        const base = el('line', { x1: 1260, x2: 1260, y1: 260, y2: 720, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
        const nrm = coef(g, 1260, 380, 120, 1.1, 0.7, 1.5, C.gray);
        const ln = txt(g, 1380, 330, '普通の区間', { size: 28, fill: C.gray });
        const rob = coef(g, 1260, 560, 120, 1.1, -0.6, 2.2, C.blue);
        const lr = txt(g, 1380, 510, '頑健な区間', { size: 28, fill: C.blue });
        const diag = box(g, 140, 620, 1020, 90, '問い：弱さを診断し、弱くても正しい区間を出す', { size: 32, stroke: C.blue, weight: 700 });
        return t => {
          show(zv, t, T[1]); drawLine(a1, prog(t, T[1] + 0.5, 0.8)); show(pv, t, T[1] + 0.9);
          drawLine(a2, prog(t, T[1] + 1.4, 0.8)); show(qv, t, T[1] + 1.8); show(term, t, T[1] + 2.4);
          show(ex, t, T[2]); show(base, t, T[2]); show(nrm, t, T[2] + 0.4); show(ln, t, T[2] + 0.4);
          show(rob, t, T[3] + 0.5); show(lr, t, T[3] + 0.5);
          dim(a1, t, T[2] + 1, 0.35);
          show(diag, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '指針は無く、道具は揃った', [
        'なぜ今なのか。理由は三つです。',
        '展望論文が、非線形の需要モデルでは診断の指針が無いと書いています。',
        '弱い操作変数の検定には、弱すぎる基準がまだありません。',
        '一方で、推定は定番のライブラリ、PyBLPが担えます。',
        '頑健な推論だけを、その上に載せればよいのです。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 640, 150, '診断の指針が無い', 'Berry と Haile（2021）の展望', C.red);
        const c2 = card(g, 120, 390, 640, 150, '「弱すぎる」の基準が無い', 'Gandhi と Houde（2019）が自ら記す', C.red);
        const lib = box(g, 960, 520, 480, 130, 'PyBLP\n推定・最適操作変数・合成データ', { size: 28, stroke: C.purple });
        const top = box(g, 960, 370, 480, 120, '新しい層：診断と頑健な区間', { size: 30, stroke: C.blue, weight: 700 });
        const arr = arrow(g, 1200, 300, 1200, 362, { color: C.blue, width: 5 });
        const lt = txt(g, 1200, 260, 'ここだけ作る', { size: 30, fill: C.blue, weight: 700 });
        return t => {
          show(c1, t, T[1]); show(c2, t, T[2]);
          dim(c1, t, T[3], 0.5); dim(c2, t, T[3], 0.5);
          show(lib, t, T[3]); show(top, t, T[4]); show(lt, t, T[4] + 0.6); drawLine(arr, prog(t, T[4] + 0.6, 0.8));
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '先行の1本：外れるが、崩れはしない', [
        '直接の先行研究は、二〇二三年のリーの論文一本です。',
        '被覆率とは、区間が真の値を含む割合のことです。',
        '名目は九割。普通の区間は、合成データで七割五分から九割でした。',
        '頑健な区間は、八割七分から九割二分で、名目に近い値でした。',
        'ただし、合成データだけです。実データへの適用は見つかっていません。',
      ], (g, T) => {
        const X = v => 560 + (v - 0.70) * 3600;           // 0.70 → 560, 0.95 → 1460
        const ax = grp(g);
        el('line', { x1: X(0.70), x2: X(0.95), y1: 640, y2: 640, stroke: C.mute, 'stroke-width': 3 }, ax);
        for (const v of [0.70, 0.80, 0.90]) txt(ax, X(v), 672, v.toFixed(2), { size: 24, fill: C.mute });
        const term = box(g, 120, 190, 900, 76, '被覆率 = 区間が真の値を含む割合', { size: 30, stroke: C.mute, color: C.mute });
        const nom = grp(g);
        el('line', { x1: X(0.90), x2: X(0.90), y1: 300, y2: 640, stroke: C.green, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, nom);
        txt(nom, X(0.90), 296, '名目 0.90', { size: 26, fill: C.green, weight: 700 });
        const bar = (y, lo, hi, col, label) => {
          const n = grp(g);
          const r = el('rect', { x: X(lo), y: y - 16, width: X(hi) - X(lo), height: 32, rx: 8, fill: col, opacity: 0.85 }, n);
          txt(n, 530, y, label, { size: 28, anchor: 'end' });
          txt(n, X(lo) - 10, y, lo.toFixed(3), { size: 24, fill: C.mute, anchor: 'end' });
          txt(n, X(hi) + 10, y, hi.toFixed(3), { size: 24, fill: C.mute, anchor: 'start' });
          n.__r = r; n.__w = X(hi) - X(lo); return n;
        };
        const b1 = bar(420, 0.748, 0.909, C.gray, '普通の区間');
        const b2 = bar(540, 0.870, 0.918, C.blue, '頑健な区間');
        const tg = tag(g, '合成データ（Lee 2023 表1・表2）');
        const warn = txt(g, 800, 730, '実データへの適用は、検索では見つからなかった', { size: 30, fill: C.yellow, weight: 700 });
        return t => {
          show(tg, t, T[0]); show(term, t, T[1]);
          show(ax, t, T[2]); show(nom, t, T[2] + 0.3);
          show(b1, t, T[2] + 1); b1.__r.setAttribute('width', Math.max(0.1, b1.__w * prog(t, T[2] + 1, 1.2)));
          show(b2, t, T[3]); b2.__r.setAttribute('width', Math.max(0.1, b2.__w * prog(t, T[3], 1.2)));
          show(warn, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', 'データは今日から使えるが、実質2つ', [
        '使うデータは、すべてPyBLPに同梱されています。',
        '入手は即日、費用は無料、区分は公開です。',
        '自動車が二つ。市場の数は、二十と十三です。',
        'シリアルのデータは、架空の製品データと明記されています。',
        '主役は合成データで、実データは例として使います。',
      ], (g, T) => {
        const tb = table(g, 160, 230, 4, 4, 320, 90);
        const head = ['データ', '市場の数', '行数', '中身'];
        const rows = [['BLP 自動車', '20', '2,217', '実データ'], ['Petrin 自動車', '13', '2,407', '実データ'], ['Nevo シリアル', '94', '2,256', '架空と明記']];
        const hd = grp(g); head.forEach((s, c) => txt(hd, tb.cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 28, fill: c === 3 && i === 2 ? C.yellow : C.ink })); return n; });
        const meta = box(g, 160, 620, 1280, 80, '入手：即日　費用：無料　区分：T0 公開', { size: 30, stroke: C.cyan });
        const sim = box(g, 160, 620, 1280, 80, '主役は合成データ。実データは例示に使う', { size: 30, stroke: C.purple, weight: 700 });
        const hi = el('rect', { x: 160, y: 320, width: 1280, height: 180, rx: 6, fill: 'none', stroke: C.cyan, 'stroke-width': 5 }, g);
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          show(meta, t, T[1], T[4] - 0.3);
          rg.forEach((n, i) => show(n, t, i < 2 ? T[2] + i * 0.6 : T[3]));
          hi.setAttribute('opacity', Math.min(prog(t, T[2] + 1.2, 0.4), 1 - prog(t, T[3], 0.4)));
          show(sim, t, T[4]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('手法の候補', '強さを動かし、当たる割合を測る', [
        '確かめ方は、合成データの実験です。',
        '操作変数の強さを、弱いから強いまで動かします。',
        '普通の区間は、弱いところで当たる割合が落ちるかを測ります。',
        '頑健な区間が、名目からプラスマイナス三ポイント以内かを見ます。',
        '同時に、どの診断が外れを予測できるかも測ります。',
      ], (g, T) => {
        const ex = tag(g, '例（架空の模式図）');
        const ax = axes(g, 200, 220, 760, 440, [0, 1], [0.6, 1.0], { xlabel: '操作変数の強さ（弱 → 強）', ylabel: '被覆率' });
        const nominal = fitline(g, ax, 0, 0.9, 1, 0.9, C.green, 3); nominal.setAttribute('stroke-dasharray', '10 8');
        const band = grp(g);
        el('rect', { x: ax.X(0), y: ax.Y(0.93), width: ax.X(1) - ax.X(0), height: ax.Y(0.87) - ax.Y(0.93), fill: C.green, 'fill-opacity': 0.15 }, band);
        const pts = []; for (let i = 0; i <= 20; i++) { const s = i / 20; pts.push(`${ax.X(s)},${ax.Y(0.68 + 0.215 * (1 - Math.exp(-5 * s)))}`); }
        const nrm = el('path', { d: 'M' + pts.join(' L'), stroke: C.gray, 'stroke-width': 5, fill: 'none' }, g);
        const rob = fitline(g, ax, 0, 0.905, 1, 0.9, C.blue, 5);
        const ln = txt(g, ax.X(0.12), ax.Y(0.66), '普通の区間', { size: 28, fill: C.gray, anchor: 'start' });
        const lr = txt(g, 1000, ax.Y(0.90), '頑健な区間', { size: 28, fill: C.blue, anchor: 'start' });
        const p1 = card(g, 1000, 470, 520, 150, '合格の線', '名目から ±3 ポイント以内', C.green);
        const p3 = card(g, 1000, 470, 520, 150, '診断が外れを当てるか', '閾値ごとの見逃しと誤警報', C.yellow);
        return t => {
          show(ex, t, T[0]); show(ax.g, t, T[0] + 0.3);
          show(nominal, t, T[1]);
          drawLine(nrm, prog(t, T[2], 1.4)); show(ln, t, T[2] + 1);
          show(band, t, T[3]); drawLine(rob, prog(t, T[3], 1.2)); show(lr, t, T[3] + 0.8);
          show(p1, t, T[3] + 1, T[4] - 0.2); show(p3, t, T[4]);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '直接の先行は1本、隣は多い', [
        '競合で最も大事なのは、リーの論文です。',
        '残る差は、過剰識別、不均一分散、実データ、公開コードです。',
        'ガンディーらの論文は、診断の半分を既に出しています。',
        'PyBLPの開発者が機能を足せば、この道具の価値は消えます。',
        '供給側の検定には、弱い操作変数の診断が先に出ています。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 460, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 640), ln(1270, 640)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 460, r: 120, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 460, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 190, y - 55, 380, 110, s, { size: 28, stroke: col });
        const lee = node(330, 290, 'Lee（2023）\n同じ問い・合成データのみ', C.red);
        const gap = txt(g, 330, 400, '残る差：実データ・公開コード', { size: 26, fill: C.yellow });
        const gh = node(1270, 290, 'Gandhi・Houde\n診断の半分', C.gray);
        const py = node(330, 640, 'PyBLP\n機能を足せば終わり', C.red);
        const du = node(1270, 640, 'Duarte ほか\n供給側の検定', C.gray);
        return t => {
          show(me, t, 0.3);
          [T[0], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(lee, t, T[0]); show(gap, t, T[1]); show(gh, t, T[2]); show(py, t, T[3]); show(du, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '再現できなければ、2か月で止める', [
        '最初の一か月で、リーの表の被覆率を再現します。',
        'プラスマイナス三ポイントで再現できなければ、実装を見直します。',
        '二か月目に、外れが五ポイント未満なら、短い報告に縮めます。',
        '一つの区間に二十四時間を超えるなら、対象を絞ります。',
        '三か月目に、結果を見る前の論文を書き、ロックします。',
      ], (g, T) => {
        const M = ['再現', '拡張', '診断\nロック', '実データ', '草稿\nライブラリ', '監査'];
        const X = i => 170 + i * 220;
        const months = M.map((s, i) => {
          const n = grp(g);
          el('rect', { x: X(i), y: 200, width: 200, height: 130, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          txt(n, X(i) + 100, 225, `${i + 1} か月`, { size: 24, fill: C.mute });
          txt(n, X(i) + 100, 285, s, { size: 28, weight: 700 });
          return n;
        });
        const back = grp(g);
        const stop = (i, y, s) => {
          const n = grp(g);
          n.__line = el('line', { x1: X(i) + 100, x2: X(i) + 100, y1: 335, y2: y - 40, stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
          box(n, X(i) + 100 - 20, y - 40, 900, 80, s, { size: 28, stroke: C.red });
          return n;
        };
        const s1 = stop(0, 440, '±3 ポイントで再現できない → 見直し');
        const s2 = stop(1, 560, '外れが 5 ポイント未満 → 短い報告に縮める');
        const s3 = stop(1, 680, '1つの区間に 24 時間超 → 対象を絞る');
        const lk = lock(g, X(2) + 100, 150, 0.5);
        return t => {
          const cur = t < T[2] ? 0 : t < T[4] ? 1 : 2;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (t < T[0] || i === cur ? 1 : 0.4)); });
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「条件つきで勧める」', [
        'AIの下書きは、条件つきで勧める、です。',
        '勝ち筋は、診断と頑健な区間の道具を作り、古典データに初めて当てることです。',
        '懸念は、普通の区間との違いが小さいかもしれないことです。',
        '理論の新しさより、実装と検証を売りにしてよいか。',
        '違いが小さくても出すか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：条件つきで勧める', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', 'PyBLP につなぐ診断と頑健な区間\n古典データに初めて当てる', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '違いが小さいかもしれない\n合成データでの外れは最大 15 ポイント', C.red);
        const q = box(g, 960, 320, 520, 280, '人が決めること\n\n実装と検証が主でよいか\n違いが小さくても出すか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1220, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
