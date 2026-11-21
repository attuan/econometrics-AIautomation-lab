// T039 テキスト・画像の埋め込みを回帰の説明変数に使うときの推論 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T039.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T039', title: '埋め込みを調整変数に使う推論', subtitle: '文章のベクトルで調整しても、区間は正しいか',
    hook: '元の問いには、もう答えが出ていました。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '数百次元の埋め込みで、区間は信用できるか', [
        'テーマは、文章や画像の埋め込みを使う回帰です。',
        '文章を事前学習モデルでベクトルにし、調整変数に入れます。',
        'ベクトルは数百から数千次元。標本は数千です。',
        '次元と標本の大きさが近いとき、区間は信用できるか。',
        '何を選べば安全か。それが問いです。',
      ], (g, T) => {
        const doc = paper(g, 170, 250, 1.1);
        const ld = txt(g, 216, 410, '文章・画像', { size: 28, fill: C.cyan });
        const ai = computer(g, 520, 310, 0.9, 'AI');
        const lai = txt(g, 520, 410, '事前学習モデル', { size: 26, fill: C.purple });
        const vec = box(g, 760, 255, 300, 110, '埋め込み', { size: 34, stroke: C.cyan });
        const dml = box(g, 1160, 255, 320, 110, '処置効果の推定', { size: 30 });
        const a1 = arrow(g, 280, 310, 425, 310, { color: C.cyan, width: 5 });
        const a2 = arrow(g, 615, 310, 752, 310, { color: C.cyan, width: 5 });
        const a3 = arrow(g, 1065, 310, 1152, 310, { color: C.ink, width: 5 });
        const term = box(g, 160, 460, 1320, 76, '埋め込み = 文章を数百〜数千個の数の並びにしたもの', { size: 30, stroke: C.mute, color: C.mute });
        const dim1 = box(g, 160, 460, 640, 100, '次元：数百〜数千', { size: 34, stroke: C.cyan });
        const dim2 = box(g, 840, 460, 640, 100, '標本：数千', { size: 34, stroke: C.gray });
        const near = txt(g, 820, 600, '大きさが近い', { size: 30, fill: C.red, weight: 700 });
        const q = box(g, 160, 640, 1320, 100, '問い：区間は信用できるか。何を選べば安全か', { size: 34, stroke: C.blue, weight: 700 });
        return t => {
          show(doc, t, T[0]); show(ld, t, T[0]);
          drawLine(a1, prog(t, T[1], 0.8)); show(ai, t, T[1] + 0.6); show(lai, t, T[1] + 0.6);
          drawLine(a2, prog(t, T[1] + 1.2, 0.8)); show(vec, t, T[1] + 1.6);
          drawLine(a3, prog(t, T[1] + 2.4, 0.6)); show(dml, t, T[1] + 2.8);
          show(term, t, T[1] + 3.2, T[2]);
          show(dim1, t, T[2]); show(dim2, t, T[2] + 1.2);
          show(near, t, T[3]);
          show(q, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '理論は2025〜2026年に一気に出た', [
        'なぜ今か。答えは、調べて変わりました。',
        '二〇二五年から二〇二六年に、理論が一気に出たのです。',
        '今は、空白を埋める時期ではありません。',
        '出た理論を、使える形にする時期です。',
        '答えが出れば、学習器の選び方と、報告すべき点検が決まります。',
      ], (g, T) => {
        const back = grp(g);
        el('line', { x1: 160, x2: 1440, y1: 330, y2: 330, stroke: C.mute, 'stroke-width': 3 }, back);
        el('line', { x1: 510, x2: 510, y1: 200, y2: 360, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
        const yr = (x, s) => txt(g, x, 230, s, { size: 30, fill: C.mute, weight: 700 });
        const y25 = yr(330, '2025'), y26 = yr(1000, '2026');
        const ev = (x, y, s) => {
          const n = grp(g);
          el('circle', { cx: x, cy: 330, r: 12, fill: C.cyan }, n);
          el('line', { x1: x, x2: x, y1: 342, y2: y - 46, stroke: C.cyan, 'stroke-width': 3 }, n);
          box(n, x - 160, y - 46, 320, 92, s, { size: 26, stroke: C.cyan });
          return n;
        };
        const e1 = ev(330, 430, 'Schulte ほか\nICML 2025');
        const e2 = ev(690, 430, 'Christensen・\nCompiani（1月）');
        const e3 = ev(1050, 430, 'Shimizu\n7月・9月 v2');
        const e4 = ev(1300, 570, 'Freyaldenhoven');
        const old = box(g, 160, 640, 600, 100, '空白を埋める時期', { size: 34, stroke: C.red, color: C.mute });
        const cross = el('line', { x1: 200, x2: 720, y1: 690, y2: 690, stroke: C.red, 'stroke-width': 5 }, g);
        const now = box(g, 840, 640, 600, 100, '使える形にする時期', { size: 34, stroke: C.blue, weight: 700 });
        return t => {
          show(back, t, 0.3); show(y25, t, 0.3); show(y26, t, 0.3);
          show(e1, t, T[1]); show(e2, t, T[1] + 0.6); show(e3, t, T[1] + 1.2); show(e4, t, T[1] + 1.8);
          show(old, t, T[2]); show(cross, t, T[2] + 1.2);
          show(now, t, T[3]);
          dim(old, t, T[4], 0.5); dim(cross, t, T[4], 0.5);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', 'Shimizu（2026）が、元の問いにほぼ答えた', [
        '中心は、二〇二六年のシミズの論文です。本文を読みました。',
        '鍵は転移可能性。事前学習の課題が、こちらに移るかです。',
        '合成データで、名目九割五分の区間の被覆率を測っています。',
        'リッジは九割四分台。ラッソは八割四分ほどに落ちました。',
        '転移可能性が破れると、被覆率は〇から四パーセントまで落ちます。',
      ], (g, T) => {
        const X = v => 560 + (v - 0.80) * 4500;           // 0.80 → 560, 1.00 → 1460
        const tg = tag(g, '合成データ（Shimizu 2026 本文。付録と証明は未読）');
        const term1 = box(g, 120, 190, 1100, 76, '転移可能性 = 事前学習の課題が、目標の課題に効くこと', { size: 30, stroke: C.mute, color: C.mute });
        const term2 = box(g, 120, 190, 1100, 76, '被覆率 = 区間が真の値を含む割合', { size: 30, stroke: C.mute, color: C.mute });
        const ax = grp(g);
        el('line', { x1: X(0.80), x2: X(1.0), y1: 610, y2: 610, stroke: C.mute, 'stroke-width': 3 }, ax);
        for (const v of [0.80, 0.90, 1.00]) txt(ax, X(v), 642, `${Math.round(v * 100)}%`, { size: 24, fill: C.mute });
        const nom = grp(g);
        el('line', { x1: X(0.95), x2: X(0.95), y1: 320, y2: 610, stroke: C.green, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, nom);
        txt(nom, X(0.95), 304, '名目 95%', { size: 26, fill: C.green, weight: 700 });
        const bar = (y, v, col, label, val) => {
          const n = grp(g);
          const r = el('rect', { x: X(0.80), y: y - 20, width: X(v) - X(0.80), height: 40, rx: 8, fill: col }, n);
          txt(n, 530, y, label, { size: 28, anchor: 'end' });
          const vt = txt(n, X(v) - 12, y, val, { size: 24, fill: C.bg, anchor: 'end', weight: 700 });
          n.__r = r; n.__w = X(v) - X(0.80); n.__v = vt; return n;
        };
        const b0 = bar(370, 0.9342, C.gray, '最小二乗', '93.42%');
        const b1 = bar(450, 0.9478, C.blue, 'リッジ', '94.78%');
        const b2 = bar(530, 0.8386, C.red, 'ラッソ', '83.86%');
        const brk = box(g, 120, 680, 1340, 84, '転移可能性が破れると：被覆率 0〜4%（非線形の設計）', { size: 30, stroke: C.red, weight: 700 });
        return t => {
          show(tg, t, T[0]);
          show(term1, t, T[1], T[2]); show(term2, t, T[2]);
          show(ax, t, T[2] + 0.3); show(nom, t, T[2] + 0.6);
          [[b0, T[2] + 1.2], [b1, T[3]], [b2, T[3] + 1.6]].forEach(([b, a]) => {
            show(b, t, a);
            const p = prog(t, a, 1.2);
            b.__r.setAttribute('width', Math.max(0.1, b.__w * p));
            b.__v.setAttribute('opacity', prog(t, a + 1.1, 0.3));
          });
          show(brk, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '律速はデータではない。ただし条件は未確認', [
        '主役は合成データです。即日、無料で作れます。',
        '実データの例は、メカニカルタークの求人、二十五万件余りです。',
        '映画レビューや、種を変えたバートの重みも候補です。',
        'ただし、配布ページを開けたものは、一つもありません。',
        '区分を書くまでは秘匿として扱い、最初の週に条件を確かめます。',
      ], (g, T) => {
        const tb = table(g, 160, 210, 3, 5, 420, 84);
        const W = [440, 340, 500], XS = [160, 600, 940];
        // 列幅を変えたいので、table() の矩形を描き直す
        tb.rect.forEach((row, r) => row.forEach((rc, c) => { rc.setAttribute('x', XS[c]); rc.setAttribute('width', W[c]); }));
        const cx = c => XS[c] + W[c] / 2;
        const head = ['データ', '件数', '確かめたこと'];
        const rows = [
          ['合成データ', '自作', '即日・無料・公開'],
          ['求人（Mechanical Turk）', '258,352', '配布ページは開けず'],
          ['映画レビュー（IMDb）', '50,000', '配布元は未確認'],
          ['種違いの BERT', '25本', '配布元は未確認'],
        ];
        const hd = grp(g); head.forEach((s, c) => txt(hd, cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, cx(c), tb.cy(i + 1), s, { size: 26, fill: c === 2 && i > 0 ? C.yellow : C.ink })); return n; });
        const hi = el('rect', { x: 160, y: 294, width: 1280, height: 84, rx: 6, fill: 'none', stroke: C.cyan, 'stroke-width': 5 }, g);
        const warn = box(g, 160, 660, 1280, 90, '区分を書くまでは T2（秘匿）として扱う。最初の週に利用条件を確かめる', { size: 28, stroke: C.yellow });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          show(rg[0], t, T[0] + 0.4); show(rg[1], t, T[1]); show(rg[2], t, T[2]); show(rg[3], t, T[2] + 1);
          const row = t < T[1] ? 0 : t < T[2] ? 1 : 2.5;
          hi.setAttribute('y', 294 + row * 84);
          hi.setAttribute('height', row === 2.5 ? 168 : 84);
          hi.setAttribute('opacity', Math.min(prog(t, T[0] + 0.4, 0.4), 1 - prog(t, T[3], 0.4)));
          show(warn, t, T[4]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('手法の候補', '実物の埋め込みで、3つの仮説を試す', [
        '絞り直した構想は、実物の埋め込みを使う半合成の実験です。',
        '一つめ。実物でも、リッジは名目に近い被覆率を保つか。',
        '二つめ。主成分で次元を落とすと、被覆率が崩れるか。',
        '三つめ。種違いの埋め込みが無くても、破れを見つけられるか。',
        'ただ、どれも理論から予想が立ちます。外れたときだけ論文になります。',
      ], (g, T) => {
        const tg = tag(g, '予想（筆者の仮定）');
        const term = box(g, 120, 190, 1360, 76, '半合成 = 実際の文章の埋め込みに、人工の処置と結果を載せる', { size: 30, stroke: C.mute, color: C.mute });
        const ha = card(g, 120, 300, 860, 140, 'H-a　リッジは名目に近いか', 'n 500〜5,000、次元 384〜1,024 で振る', C.yellow);
        const hb = card(g, 120, 465, 860, 140, 'H-b　主成分で落とすと崩れるか', '交絡を載せる成分の位置と、次元 k を振る', C.yellow);
        const hc = card(g, 120, 630, 860, 140, 'H-c　種違いなしで破れを検出', '別モデル間のばらつきを、検定と比べる', C.yellow);
        const risk = box(g, 1030, 300, 450, 470, 'どれも\n理論から\n予想が立つ\n\n外れたときだけ\n論文になる', { size: 32, stroke: C.red });
        return t => {
          show(tg, t, T[1]); show(term, t, T[0]);
          show(ha, t, T[1]); show(hb, t, T[2]); show(hc, t, T[3]);
          dim(ha, t, T[2], 0.5); dim(hb, t, T[3], 0.5);
          show(risk, t, T[4]);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '元の構想の中心は、既に取られている', [
        '最大の競合はシミズの論文。元の構想とほぼ同じです。',
        '著者は、シミュレーションを拡張中と書いています。',
        'シュルテらは、ラッソは危ないという指針を先に出しました。',
        'チェルノジュコフらは道具を持ち、最短距離にいます。',
        '需要推定の補正は、クリステンセンらが出しています。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 470, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 650), ln(1270, 650)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 470, r: 115, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 470, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 210, y - 55, 420, 110, s, { size: 28, stroke: col });
        const sh = node(330, 290, 'Shimizu（2026）\n元の構想とほぼ同じ', C.red);
        const ext = txt(g, 330, 395, '「拡張中」→ 次の版で埋まりうる', { size: 26, fill: C.yellow });
        const sc = node(1270, 290, 'Schulte ほか（2025）\nラッソは危ない', C.gray);
        const ch = node(330, 650, 'Chernozhukov ら\nDoubleML を持つ', C.red);
        const cc = node(1270, 650, 'Christensen・Compiani\n需要の補正（要旨のみ）', C.gray);
        return t => {
          show(me, t, 0.3);
          [T[0], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(sh, t, T[0]); show(ext, t, T[1]); show(sc, t, T[2]); show(ch, t, T[3]); show(cc, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '進めるなら T031 の中で、早めに止める', [
        '着手は勧めていません。これは、人が進めると決めた場合の案です。',
        '一か月目に、シミズの被覆率を再現します。先に出されたら、やめます。',
        '二か月目、リッジが理論どおりなら、単独の論文はやめます。',
        '三か月目、九割を下回る設計が作れなければ、主成分の仮説をやめます。',
        '進めるときも、三十一番のテーマのライブラリの中で行います。',
      ], (g, T) => {
        const M = ['再現', 'H-a\n半合成', 'H-b\nロック', 'H-c\n診断', '例示\nライブラリ', '監査'];
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
          box(n, X(i) + 100 - 20, y - 40, 840, 80, s, { size: 28, stroke: C.red });
          return n;
        };
        const s1 = stop(0, 420, '同じ点検が先に出ていた → やめる');
        const s2 = stop(1, 530, 'リッジが全セル 93〜97% → T031 の機能に落とす');
        const s3 = stop(2, 640, '90% を下回る設計が作れない → H-b をやめる');
        const t031 = box(g, 170, 700, 1300, 70, '単独ではなく T031（AI が作った変数）のライブラリの中で', { size: 28, stroke: C.orange });
        const lk = lock(g, X(2) + 100, 150, 0.5);
        return t => {
          const cur = t < T[1] ? -1 : t < T[2] ? 0 : t < T[3] ? 1 : 2;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (cur < 0 || i === cur ? 1 : 0.4)); });
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[3] + 0.3); setLock(lk, prog(t, T[3] + 1, 0.8));
          show(t031, t, T[4]);
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「元のままでは勧めない」', [
        'AIの下書きは、元の構想のままでは着手を勧めない、です。',
        '勝ち筋は、実物の埋め込みでの点検と、診断つきの道具です。',
        '懸念は、先行する著者が、次の版で隙間を埋めうることです。',
        '答えが出たという評価に同意するか。隙間を吸収するか、捨てるか。',
        '手法の枠を、どのテーマで埋めるか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：元のままでは勧めない', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '実物の埋め込みでの半合成の点検\n診断つきライブラリ（T031 の1機能）', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', 'Shimizu は進行中の原稿\n次の版で隙間が埋まりうる', C.red);
        const q = box(g, 960, 320, 540, 380, '人が決めること\n\n答えが出たと同意するか\n隙間を T031 に吸収か\n捨てるか\n手法の枠をどう埋めるか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
