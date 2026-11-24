// T099 生成 AI の普及が職種別の求人と賃金に与える効果 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T099.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T099', title: '生成AIと職種別の求人', subtitle: '曝露度の高い職種で、求人と賃金は変わったか',
    hook: '米国で割れた設計を、日本で点検できるか。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '曝露度の高い職種で、求人は変わったか', [
        'テーマは、生成AIの普及が職種別の求人と賃金に与える効果です。',
        '曝露度とは、生成AIで速くなる仕事がどれだけ含まれるかの指標です。',
        '曝露度の高い職種と低い職種を、ChatGPT公開の前後で比べます。',
        '差の差、つまり前後の変化を二つの群で比べる方法です。',
        '日本で、求人数と提示賃金は相対的に変わったか。それが問いです。',
      ], (g, T) => {
        const ex = tag(g, '例（架空の模式図）');
        const ax = axes(g, 160, 240, 760, 360, [0, 10], [0, 10], { xlabel: '時間', ylabel: '求人数' });
        const vl = grp(g);
        el('line', { x1: ax.X(5), x2: ax.X(5), y1: 250, y2: 600, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, vl);
        txt(vl, ax.X(5), 222, 'ChatGPT 公開（2022年11月）', { size: 26, fill: C.mute });
        const hiPre = fitline(g, ax, 0, 7, 5, 7.6, C.blue);
        const loPre = fitline(g, ax, 0, 3.4, 5, 4.0, C.gray);
        const loPost = fitline(g, ax, 5, 4.0, 10, 4.6, C.gray);
        const hiQ = txt(g, ax.X(7.5), ax.Y(7.8), '？', { size: 56, weight: 800, fill: C.blue });
        const lh = txt(g, ax.X(2.5), ax.Y(8.6), '曝露が高い職種', { size: 28, fill: C.blue, weight: 700 });
        const ll = txt(g, ax.X(2.5), ax.Y(2.4), '曝露が低い職種', { size: 28, fill: C.gray, weight: 700 });
        const t1 = box(g, 1000, 260, 480, 130, '曝露度 = 生成 AI で\n速くなる仕事の多さ', { size: 30, stroke: C.mute, color: C.mute });
        const t2 = box(g, 1000, 440, 480, 130, '差の差 = 前後の変化を\n二つの群で比べる', { size: 30, stroke: C.mute, color: C.mute });
        const q = box(g, 140, 680, 1340, 80, '問い：日本で、求人数と提示賃金は相対的に変わったか', { size: 30, stroke: C.blue, weight: 700 });
        return t => {
          show(t1, t, T[1]);
          show(ex, t, T[2]); show(ax.g, t, T[2]); show(vl, t, T[2] + 0.4);
          drawLine(hiPre, prog(t, T[2] + 0.8, 0.8)); drawLine(loPre, prog(t, T[2] + 0.8, 0.8));
          show(lh, t, T[2] + 1.4); show(ll, t, T[2] + 1.4);
          drawLine(loPost, prog(t, T[3], 0.8)); show(hiQ, t, T[3] + 0.6); show(t2, t, T[3]);
          show(q, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '事後は長くなったが、今は後追いの時期', [
        'なぜ今か。そして、なぜ遅いのか。',
        'ChatGPTの公開から四年たち、事後の期間は十分に長くなりました。',
        '一方で米国では、二〇二五年から二〇二六年に論文が集中して出ました。',
        '今は先頭ではなく、後追いの時期です。',
        '日本では、事後の実績を使う推定は少ないものの、ゼロではありません。',
      ], (g, T) => {
        const X = y => 200 + (y - 2022) * 260;
        const ax = grp(g);
        el('line', { x1: X(2022), x2: X(2027), y1: 280, y2: 280, stroke: C.mute, 'stroke-width': 3 }, ax);
        for (const y of [2022, 2023, 2024, 2025, 2026]) {
          el('line', { x1: X(y), x2: X(y), y1: 270, y2: 290, stroke: C.mute, 'stroke-width': 3 }, ax);
          txt(ax, X(y), 245, String(y), { size: 24, fill: C.mute });
        }
        const post = arrow(g, X(2022.9), 340, X(2026.85), 340, { color: C.green, width: 5 });
        const pl = txt(g, (X(2022.9) + X(2026.85)) / 2, 380, '事後の期間 4 年', { size: 30, fill: C.green, weight: 700 });
        const papers = [0, 1, 2, 3, 4].map(i => paper(g, X(2025) + i * 70, 420, 0.8));
        const lp = txt(g, X(2025.6), 560, '米国の論文が集中', { size: 30, fill: C.cyan, weight: 700 });
        const late = txt(g, 500, 500, '先頭ではなく、後追い', { size: 36, fill: C.red, weight: 800 });
        const jp = card(g, 200, 620, 1200, 110, '日本：事後の推定は少ないが、ゼロではない', '', C.yellow);
        return t => {
          show(ax, t, T[0]);
          drawLine(post, prog(t, T[1], 1.2)); show(pl, t, T[1] + 0.8);
          papers.forEach((p, i) => show(p, t, T[2] + i * 0.25)); show(lp, t, T[2] + 1.2);
          show(late, t, T[3]);
          show(jp, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '米国の結果は、事前トレンドで割れている', [
        '米国では、同じ設計の論文が確認できただけで六本以上あります。',
        'リューらは求人二・八五億件で、曝露の高い職種の求人減を報告しました。',
        'チェリーナらは三・六八億件で、差は公開より前から始まっていたと反論します。',
        'デンマークでは、賃金への効果はゼロに近いという結果もあります。',
        'どれも要旨しか読めておらず、標準誤差は確かめていません。',
      ], (g, T) => {
        const top = box(g, 120, 190, 1360, 76, '米国で同じ設計の論文：確認できただけで 6 本以上', { size: 30, stroke: C.cyan });
        const liu = card(g, 120, 300, 640, 170, 'Liu・Wang・Yu（2025）', '求人 2.85 億件\n曝露の高い職種で求人が減った', C.blue);
        const cer = card(g, 840, 300, 640, 170, 'Cerina ほか（2026）', '求人 3.68 億件\n差は公開より前に始まっていた', C.gray);
        const vs = grp(g); arrow(vs, 790, 385, 830, 385, { color: C.yellow, width: 4 }); arrow(vs, 810, 385, 770, 385, { color: C.yellow, width: 4 });
        const hum = card(g, 840, 500, 640, 150, 'Humlum・Vestergaard', 'デンマーク：賃金への効果はゼロに近い', C.gray);
        const note = txt(g, 800, 710, '読んだ深さ：要旨。標準誤差は未確認', { size: 30, fill: C.yellow, weight: 700 });
        return t => {
          show(top, t, T[0]); show(liu, t, T[1]); show(cer, t, T[2]); show(vs, t, T[2] + 0.6);
          show(hum, t, T[3]); show(note, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '公表値は今日から使えるが、過去の求人票は無い', [
        '公表値の職業安定業務統計は、無料で即日、公開で使えます。',
        'ただし職業の区分は約五十五。提示賃金の表はありません。',
        'ハローワークの求人票は、二〇二二年以前を今から集める手段がありません。',
        '事前の期間が作れないので、これが致命的です。',
        '民間の求人データは見積もり制で、費用は分かっていません。',
        'なお公表値の数値は、結果変数に当たるため、まだ読んでいません。',
      ], (g, T) => {
        const tb = table(g, 160, 190, 4, 4, 320, 80);
        const head = ['データ', '単位', '費用・期間', '区分'];
        const rows = [['職業安定業務統計', '約55職業 × 月', '無料・即日', 'T0'], ['ハローワーク求人票', '求人票1件', '過去分は無い', 'T1 相当'], ['HRog（民間）', '2018年から週次', '見積もり制', 'T1']];
        const hd = grp(g); head.forEach((s, c) => txt(hd, tb.cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const colr = (i, c) => (i === 1 && c === 2 ? C.red : i === 2 && c === 2 ? C.yellow : C.ink);
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 28, fill: colr(i, c) })); return n; });
        const a = box(g, 160, 540, 1280, 80, '区分は約 55・職種別の提示賃金の表は無い', { size: 30, stroke: C.yellow });
        const b = box(g, 160, 540, 1280, 80, '2022年以前の求人票が無い → 事前の期間が作れない', { size: 30, stroke: C.red, weight: 700 });
        const f = box(g, 160, 650, 1280, 80, '公表値の数値は未読（結果変数に当たるため）', { size: 30, stroke: C.orange });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]); show(rg[0], t, T[0] + 0.5);
          show(a, t, T[1], T[3] - 0.3);
          show(rg[1], t, T[2]);
          show(b, t, T[3]);
          show(rg[2], t, T[4]);
          show(f, t, T[5]);
        };
      }),

      // 5 外生変動の候補 -------------------------------------------------
      scene('外生変動の候補', '処置の4か月後に、職業分類が変わる', [
        '無作為化も、制度の閾値もありません。',
        '使えるのは、ChatGPT公開の時点と職業の曝露度の組合せだけです。',
        '日本には固有の罠があります。処置の四か月後に職業分類が変わりました。',
        '結果変数の測り方が変わるので、効果と区別できないおそれがあります。',
        '新旧の系列の重なりは十二か月。ここで突き合わせて点検します。',
      ], (g, T) => {
        const X = m => 160 + m * (1280 / 27);          // m = 2021年10月からの月数
        const top = box(g, 300, 200, 1000, 90, '使える変動：公開の時点 × 職業の曝露度', { size: 32, stroke: C.blue, weight: 700 });
        const ov = grp(g);
        el('rect', { x: X(6), y: 355, width: X(18) - X(6), height: 180, rx: 8, fill: C.green, 'fill-opacity': 0.15, stroke: C.green, 'stroke-width': 3 }, ov);
        const old = grp(g);
        el('rect', { x: X(0), y: 370, width: X(18) - X(0), height: 60, rx: 8, fill: C.panel, stroke: C.gray, 'stroke-width': 3 }, old);
        txt(old, X(0) + 20, 400, '旧系列 〜2023年3月', { size: 26, fill: C.gray, anchor: 'start' });
        const nw = grp(g);
        el('rect', { x: X(6), y: 460, width: X(27) - X(6), height: 60, rx: 8, fill: C.panel, stroke: C.cyan, 'stroke-width': 3 }, nw);
        txt(nw, X(27) - 20, 490, '新系列 2022年4月〜', { size: 26, fill: C.cyan, anchor: 'end' });
        const axl = grp(g);
        el('line', { x1: X(0), x2: X(27), y1: 550, y2: 550, stroke: C.mute, 'stroke-width': 3 }, axl);
        [[3, '2022'], [15, '2023'], [27, '2024']].forEach(([m, s]) => {
          el('line', { x1: X(m), x2: X(m), y1: 540, y2: 560, stroke: C.mute, 'stroke-width': 3 }, axl);
          txt(axl, X(m), 585, s, { size: 24, fill: C.mute });
        });
        const cg = grp(g);
        el('line', { x1: X(14), x2: X(14), y1: 335, y2: 540, stroke: C.blue, 'stroke-width': 4 }, cg);
        txt(cg, X(14), 315, 'ChatGPT 公開 2022年11月', { size: 26, fill: C.blue, weight: 700 });
        const sw = grp(g);
        el('line', { x1: X(17.65), x2: X(17.65), y1: 355, y2: 610, stroke: C.red, 'stroke-width': 4 }, sw);
        txt(sw, X(17.65) + 80, 635, '分類の切替 2023年3月20日', { size: 26, fill: C.red, weight: 700 });
        const br = grp(g);
        el('path', { d: `M${X(14)},680 V695 H${X(17.65)} V680`, fill: 'none', stroke: C.red, 'stroke-width': 3 }, br);
        txt(br, (X(14) + X(17.65)) / 2, 730, '約 4 か月', { size: 28, fill: C.red, weight: 700 });
        const ovl = txt(g, (X(6) + X(18)) / 2, 730, '重なり 12 か月で突き合わせる', { size: 28, fill: C.green, weight: 700 });
        return t => {
          show(top, t, T[1], T[2] - 0.2);
          show(old, t, T[2]); show(nw, t, T[2] + 0.3); show(axl, t, T[2]);
          show(cg, t, T[2] + 0.8); show(sw, t, T[2] + 1.6); show(br, t, T[2] + 2.4, T[4] - 0.2);
          dim(old, t, T[3], 0.6); dim(nw, t, T[3], 0.6);
          show(ov, t, T[4]); show(ovl, t, T[4]);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '日本でも、公表値版は既に試されている', [
        'いちばん近いのは、日本の公表値を使ったアマダの論文です。',
        '構想とほぼ差がありません。ただし本文は未読で、最優先で確かめます。',
        '米国では、数億件の求人票で同じ設計が何本も実行済みです。',
        '厚生労働省や求人サイトの会社は、自前の全件データを持っています。',
        '内部で分析されれば、外部からは太刀打ちできません。筆者の見解です。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 460, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 640), ln(1270, 640)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 460, r: 120, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 460, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 220, y - 60, 440, 120, s, { size: 28, stroke: col });
        const am = node(330, 290, 'Amada（SSRN）\n差がほぼ無い・本文は未読', C.red);
        const us = node(1270, 290, 'Liu・Cerina ほか\n数億件の求人票', C.gray);
        const mh = node(330, 640, '厚生労働省・JILPT\n求人票の全件と過去分', C.red);
        const ind = node(1270, 640, 'Indeed Hiring Lab\n自社の求人全件', C.red);
        return t => {
          show(me, t, T[0]);
          [T[0], T[2], T[3], T[3] + 0.6].forEach((a, i) => { show(l[i], t, a); });
          show(am, t, T[0] + 0.3); show(us, t, T[2]); show(mh, t, T[3]); show(ind, t, T[3] + 0.6);
          dim(us, t, T[4], 0.4); dim(am, t, T[4], 0.4);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', 'アマダ論文が点検済みなら、1か月目で止める', [
        '結論は勧めないですが、着手するなら設計を点検する短報に絞ります。',
        '一か月目、アマダ論文が分類の切り替えまで点検済みなら、やめます。',
        '曝露度の上位十区分のうち三つ以上が新旧で接続できなくても、やめます。',
        '二か月目、合成データで一割の差を検出する確率が五割未満なら、やめます。',
        '二か月目に結果を見る前の論文を書き、人の承認でロックします。',
      ], (g, T) => {
        const M = ['本文\n接続表', '曝露度\nロック', '推定', '全組合せ', '監査', '短報\n公開'];
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
          box(n, X(i) + 100 - 20, y - 40, 940, 80, s, { size: 28, stroke: C.red });
          return n;
        };
        const s1 = stop(0, 440, 'Amada が分類の切替まで点検済み → やめる');
        const s2 = stop(0, 560, '上位10区分の3つ以上が新旧で接続できない → やめる');
        const s3 = stop(1, 680, '1割の差の検出確率が 50% 未満（合成データ） → やめる');
        const lk = lock(g, X(1) + 100, 150, 0.5);
        const shortp = box(g, 1050, 360, 480, 80, '縮小版：設計の点検の短報', { size: 26, stroke: C.yellow });
        return t => {
          const cur = t < T[3] ? 0 : 1;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (t < T[1] || i === cur ? 1 : 0.4)); });
          show(shortp, t, T[0] + 0.5, T[1] - 0.2);
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「元の構想では勧めない」', [
        'AIの下書きは、元の構想のままでは勧めない、です。',
        '勝ち筋は、米国で割れた点を、日本の公表値で全組合せ点検する短報です。',
        '懸念は、職業の区分が約五十五しかなく、分類も途中で変わることです。',
        'アマダ論文に穴は残るか。民間のデータに払うか。',
        '設計の点検の短報でよいか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：元の構想では勧めない', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '米国で割れた事前トレンドを\n曝露度 × 仕様の全組合せで点検', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '区分は約 55 しかない\n処置の4か月後に分類が切り替わる', C.red);
        const q = box(g, 960, 320, 540, 300, '人が決めること\n\nAmada 論文に穴は残るか\n民間データに払うか\n設計の点検の短報でよいか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
