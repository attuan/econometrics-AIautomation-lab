// T068 観測されない異質性をもつ動学モデルの推定法の小標本での性能 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T068.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T068', title: '異質性つき動学モデルの推定法', subtitle: 'どの条件で、どの推定法が、どう壊れるか',
    hook: '速さの競争は終わりました。残るのは失敗の地図です。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '小さな標本で、どの推定法が壊れるか', [
        'テーマは、観測されない異質性をもつ動学モデルの推定です。',
        '人には見えないタイプがあり、タイプごとに選び方が違います。',
        'このタイプを、有限個の混合として推定します。',
        '推定法はいくつもあります。小さな標本で、どれが信用できるか。',
        '偏り、被覆率、収束の失敗、反実仮想の誤差を比べます。',
      ], (g, T) => {
        const ex = tag(g, '例（架空の模式図）');
        const R = rng(68);
        const ppl = [];
        for (let i = 0; i < 12; i++) {
          const x = 180 + (i % 6) * 120, y = 270 + Math.floor(i / 6) * 135;
          const type = R() < 0.5 ? 0 : 1;
          const n = grp(g);
          const gray = person(n, x, y, 0.55, C.gray);
          const col = person(n, x, y, 0.55, type ? C.blue : C.cyan);
          ppl.push({ n, col });
        }
        const lA = txt(g, 900, 280, 'タイプ1', { size: 32, fill: C.cyan, weight: 700, anchor: 'start' });
        const lB = txt(g, 900, 350, 'タイプ2', { size: 32, fill: C.blue, weight: 700, anchor: 'start' });
        const term = box(g, 120, 470, 1360, 76, '有限混合 = 見えないタイプが、有限個まざっている', { size: 30, stroke: C.mute, color: C.mute });
        const ms = ['NFXP（FIML）', 'EM つき CCP', 'EM-NPL', 'MPEC'].map((s, i) => box(g, 120 + i * 345, 580, 325, 80, s, { size: 28, stroke: C.purple }));
        const met = box(g, 120, 690, 1360, 80, '比べる：偏り・被覆率・収束の失敗・反実仮想の誤差', { size: 30, stroke: C.blue, weight: 700 });
        return t => {
          ppl.forEach((p, i) => { show(p.n, t, T[0] + i * 0.08); p.col.setAttribute('opacity', prog(t, T[1] + 0.5, 0.8)); });
          show(ex, t, T[1]); show(lA, t, T[1] + 1); show(lB, t, T[1] + 1);
          show(term, t, T[2]);
          ms.forEach((m, i) => show(m, t, T[3] + i * 0.3));
          dim(term, t, T[3], 0.5);
          show(met, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '2026年、隣の問いが一気に埋まった', [
        'なぜ今か。二〇二六年に、中心の二チームが動きました。',
        'チェン、笠原、下松が、四月に新しい逐次推定を出しました。',
        'ブレビンスとキムは、古典的な推定法の再現と、異質性への拡張を出しました。',
        '手法が増えた直後は、第三者の比較に需要が出やすい。これは筆者の見解です。',
        'ただし、速さと再現は、もう空いていません。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 760, 150, 'EM-NPL(q)　2026年4月', 'Chen・Kasahara・Shimotsu（第2版は9月）', C.cyan);
        const c2 = card(g, 120, 390, 760, 150, 'NPL の再現と異質性への拡張', 'Blevins・Kim（2026年、草稿）', C.cyan);
        const view = box(g, 960, 200, 520, 340, '筆者の見解\n\n第三者の比較に\n需要が出やすい\n\n（需要の大きさは未確認）', { size: 28, stroke: C.yellow });
        const done = box(g, 120, 600, 1360, 100, '「速さ」と「NPL の再現」は、もう空いていない', { size: 34, stroke: C.red, weight: 700 });
        return t => {
          show(c1, t, T[1]); show(c2, t, T[2]);
          show(view, t, T[3]);
          show(done, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '既存の比較は大標本で、被覆率が無い', [
        '既存の比較は、提案者が自分の手法を確かめたものです。',
        'アルシディアコノとミラーは、千台、二十期で比べました。',
        'チェンらは、五千社、二十期です。どちらも被覆率は測っていません。',
        'タイプ数は、どれも既知として扱っています。',
        '系統をまたぐ比較は、検索では見つかりませんでした。',
        'ただ、二〇二一年の博士論文が先行している可能性があります。本文は未読です。',
      ], (g, T) => {
        const W = [380, 300, 400, 200], XS = [120, 500, 800, 1200];
        const tb = table(g, 120, 200, 4, 3, 300, 90);
        tb.rect.forEach((row, r) => row.forEach((rc, c) => { rc.setAttribute('x', XS[c]); rc.setAttribute('width', W[c]); }));
        const cx = c => XS[c] + W[c] / 2;
        const hd = grp(g); ['論文（単一主体）', '標本', '比べたもの', '被覆率'].forEach((s, c) => txt(hd, cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rows = [['Arcidiacono・Miller 2011', '1000台 × 20期', 'FIML 対 EM つき CCP', '無い'], ['Chen ほか 2026', '5000社 × 20期', '自分の系統の中', '無い']];
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, cx(c), tb.cy(i + 1), s, { size: 26, fill: c === 3 ? C.red : C.ink, weight: c === 3 ? 700 : 500 })); return n; });
        const cov = el('rect', { x: 1200, y: 290, width: 200, height: 180, rx: 6, fill: 'none', stroke: C.red, 'stroke-width': 5 }, g);
        const known = box(g, 120, 500, 1280, 76, 'タイプ数：どれも既知として扱う', { size: 30, stroke: C.mute });
        const gap = box(g, 120, 600, 620, 100, '系統をまたぐ比較：\n検索では見つからず', { size: 28, stroke: C.red });
        const gm = box(g, 780, 600, 620, 100, 'Gomes（2021）博士論文が\n先行の可能性・本文は未読', { size: 28, stroke: C.yellow });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          show(rg[0], t, T[1]); show(rg[1], t, T[2]);
          cov.setAttribute('opacity', prog(t, T[2] + 1.5, 0.4));
          show(known, t, T[3]); show(gap, t, T[4]); show(gm, t, T[5]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '合成データで完結。実データは例示だけ', [
        'このテーマは、合成データで完結します。即日、無料です。',
        '例示には、ラストのバスのエンジン交換データを使います。',
        '直接ダウンロードできますが、ライセンスの記載がありません。',
        '原著の再現ファイルは、配らずに書き直します。',
        '四つの推定法を同じ土台で呼べるライブラリは、見当たりませんでした。',
        'ただし、ギットハブの直接の検索はできておらず、未確認です。',
      ], (g, T) => {
        const W = [440, 400, 440], XS = [160, 600, 1000];
        const tb = table(g, 160, 200, 3, 4, 420, 80);
        tb.rect.forEach((row, r) => row.forEach((rc, c) => { rc.setAttribute('x', XS[c]); rc.setAttribute('width', W[c]); }));
        const cx = c => XS[c] + W[c] / 2;
        const hd = grp(g); ['データ', '入手', '注意'].forEach((s, c) => txt(hd, cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rows = [['合成データ', '自作・即日・無料', 'T0・制約なし'], ['Rust のバス', '直接ダウンロード', 'ライセンスの記載なし'], ['原著の再現ファイル', '論文のページの zip', '配らずに書き直す']];
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, cx(c), tb.cy(i + 1), s, { size: 26, fill: c === 2 && i > 0 ? C.yellow : C.ink })); return n; });
        const lib = box(g, 160, 560, 1280, 100, '既存の実装：ruspy は異質性なし、respy は保守停止\n4つの推定法を同じ土台で呼べるものは見当たらない', { size: 28, stroke: C.purple });
        const unv = box(g, 160, 680, 1280, 76, 'GitHub の直接検索と Julia は未調査 ＝ 空白は未確認', { size: 28, stroke: C.yellow });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          show(rg[0], t, T[0] + 0.4); show(rg[1], t, T[1]); show(rg[2], t, T[3]);
          show(lib, t, T[4]); show(unv, t, T[5]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('シミュレーション', '条件を振って、失敗の地図を描く', [
        'やり方は、合成データの大きな実験です。',
        '個体数を二百から五千、期間を三から二十まで振ります。',
        'タイプ数をわざと誤り、初期値も変えて、四つの推定法を比べます。',
        '予想は三つ。数百の標本では、どの方法も被覆率が名目を下回る。',
        '過少指定は反実仮想を歪め、初期化の差が方法の差より大きい、とみます。',
      ], (g, T) => {
        const ex = tag(g, '例（架空の模式図）');
        const Ns = ['200', '500', '1000', '5000'], Ts = ['3', '6', '10', '20'];
        const x0 = 260, y0 = 230, cw = 130, ch = 95;
        const grid = grp(g);
        const cells = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          const bad = clamp(1 - (r + c) / 5);
          const cg = grp(grid);
          el('rect', { x: x0 + c * cw, y: y0 + r * ch, width: cw - 6, height: ch - 6, rx: 8, fill: C.red, 'fill-opacity': 0.12 + 0.6 * bad, stroke: C.line, 'stroke-width': 2 }, cg);
          cells.push(cg);
        }
        const xl = grp(g); Ns.forEach((s, c) => txt(xl, x0 + c * cw + cw / 2 - 3, y0 + 4 * ch + 26, s, { size: 24, fill: C.mute }));
        txt(xl, x0 + 2 * cw, y0 + 4 * ch + 66, '個体数 N', { size: 26, fill: C.mute });
        const yl = grp(g); Ts.forEach((s, r) => txt(yl, x0 - 30, y0 + r * ch + ch / 2 - 3, s, { size: 24, fill: C.mute, anchor: 'end' }));
        txt(yl, x0 - 30, y0 - 30, '期間 T', { size: 26, fill: C.mute, anchor: 'end' });
        const red = txt(g, x0 + 2 * cw, 210 - 20, '色が濃いほど壊れる（例）', { size: 24, fill: C.red });
        const knobs = box(g, 900, 210, 580, 130, 'タイプ数の誤り・初期値\n× 4つの推定法', { size: 30, stroke: C.purple });
        const pt = txt(g, 1190, 380, '予想（筆者の仮定）', { size: 26, fill: C.yellow, weight: 700 });
        const ha = card(g, 900, 410, 580, 110, '(a) 数百では被覆率が下がる', '', C.yellow);
        const hb = card(g, 900, 535, 580, 110, '(b) 過少指定は反実仮想を歪める', '', C.yellow);
        const hc = card(g, 900, 660, 580, 110, '(c) 初期化の差 > 方法の差', '', C.yellow);
        return t => {
          show(ex, t, T[1]); show(grid, t, T[1]); show(xl, t, T[1] + 0.5); show(yl, t, T[1] + 0.5); show(red, t, T[1] + 1.2);
          show(knobs, t, T[2]);
          show(pt, t, T[3]); show(ha, t, T[3] + 0.4);
          show(hb, t, T[4]); show(hc, t, T[4] + 3);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '有力な2チームが、両隣を埋めた', [
        'チェンらは、自分の系統の速さと精度を比べました。脅威は高いです。',
        'ブレビンスとキムの切り口は、再現と被覆率と初期化。ほぼ同じです。',
        '真ん中の、系統横断、小標本、タイプ数の誤りは、まだ空いています。',
        'ただし、二チームは半年以内に、そこを埋める力を持っています。',
        '速くする近似手法の、六十七番のテーマとは、まとめることを勧めます。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 420, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(310, 300), ln(1290, 300), ln(800, 660)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 420, r: 130, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 420, '本テーマ\n真ん中', { size: 32, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 250, y - 60, 500, 120, s, { size: 28, stroke: col });
        const ch = node(310, 300, 'Chen・Kasahara・Shimotsu\n脅威：高い', C.red);
        const bk = node(1290, 300, 'Blevins・Kim\n脅威：高い', C.red);
        const mid = txt(g, 800, 590, '空き：系統横断・小標本・タイプ数の誤り', { size: 28, fill: C.green, weight: 700 });
        const warn = txt(g, 800, 180, '半年以内に埋める力がある', { size: 30, fill: C.red, weight: 700 });
        const t67 = node(800, 700, 'T067（速くする近似）\n統合を勧める', C.orange);
        return t => {
          show(me, t, 0.3);
          show(l[0], t, T[0]); show(ch, t, T[0]);
          show(l[1], t, T[1]); show(bk, t, T[1]);
          show(mid, t, T[2], T[4] - 0.3);
          show(warn, t, T[3]);
          show(l[2], t, T[4]); show(t67, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '再現できなければ、2か月で止める', [
        '一か月目に、競合を確かめ直し、原著の表を再現し始めます。',
        '小さな標本で三系統以上を比べ、被覆率まで出した先行があれば、論文はやめます。',
        '二か月目までに、原著の表一を再現できなければ止めます。',
        '三か月目、差が一割未満で被覆率も名目近くなら、短い報告に縮めます。',
        '二か月目の終わりに、設定と手法と指標を、人の承認でロックします。',
      ], (g, T) => {
        const M = ['再確認\n再現', '追加\nロック', '本実験', '反実仮想\nバス', 'ライブラリ', '監査'];
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
          box(n, X(i) + 100 - 20, y - 40, 880, 80, s, { size: 28, stroke: C.red });
          return n;
        };
        const s1 = stop(0, 430, 'N≤1000 で3系統以上・被覆率の先行 → 論文はやめる');
        const s2 = stop(1, 545, '表1（タイプ非観測の列）を再現できない → 止める');
        const s3 = stop(2, 660, '差が10%未満・被覆率 93〜97% → 短い報告に');
        const lk = lock(g, X(1) + 100, 150, 0.5);
        return t => {
          const cur = t < T[1] ? 0 : t < T[2] ? 0 : t < T[3] ? 1 : t < T[4] ? 2 : 1;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (t < T[0] || i === cur ? 1 : 0.4)); });
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「条件つきで勧める」', [
        'AIの下書きは、条件つきで勧める、です。',
        '条件は、問いを失敗の地図に替え、六十七番のテーマとまとめることです。',
        '勝ち筋は、推定法を一つのライブラリにまとめ、壊れる条件を示すことです。',
        '懸念は、二チームがコードと比較を出せば、新規性がほぼ消えることです。',
        '統合の形、成果の置き場、損切りの線。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：条件つきで勧める', { size: 32, stroke: C.purple, weight: 700 });
        const cond = box(g, 960, 190, 540, 90, '条件：失敗の地図・T067 と統合', { size: 28, stroke: C.purple });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '推定法を1つの Python ライブラリに\n壊れる条件を再現できる形で示す', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '2チームがコードと比較を出すと\n新規性がほぼ消える', C.red);
        const q = box(g, 960, 370, 540, 330, '人が決めること\n\nT067 と統合か、T069 の基準か\n主な成果をライブラリに置くか\n先を越されたら、どこで損切りか', { size: 26, stroke: C.orange });
        const gt = gate(g, 1230, 330, 32);
        return t => {
          show(draft, t, T[0]); show(cond, t, T[1]); show(win, t, T[2]); show(risk, t, T[3]);
          show(gt, t, T[4]); show(q, t, T[4] + 0.3);
        };
      }),
    ],
  });
})();
