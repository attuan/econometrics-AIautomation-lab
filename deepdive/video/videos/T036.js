// T036 有価証券報告書のテキストから作る不確実性指標と設備投資 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T036.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
// 先行研究の多くは要旨だけ、Chen ほか (2025) は本文未読。これを画面と字幕で言う。
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
    id: 'T036', title: '有報の不確実性と設備投資', subtitle: '開示文書のリスクの記述が増えると、投資は減るか',
    hook: '同じ問いに、既に答えた論文がありました。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', 'リスクの記述が増えると、投資は減るか', [
        'テーマは、有価証券報告書の文章と、設備投資です。',
        '企業が書く不確実性やリスクの記述から、指標を作ります。',
        'その記述が増えると、翌期の設備投資は減るのか。それが問いです。',
        '答えが出れば、企業別の不確実性を、調査票なしで毎年測れます。',
        'AIの下書きは、今の形のままでは、着手を勧めない、です。',
      ], (g, T) => {
        const pap = paper(g, 140, 250, 1.1);
        const pl = txt(g, 186, 410, '有価証券報告書', { size: 26, fill: C.cyan });
        const a1 = arrow(g, 250, 310, 350, 310, { color: C.cyan, width: 5 });
        const idx = box(g, 360, 255, 330, 110, '不確実性の指標', { size: 32, stroke: C.purple });
        const a2 = arrow(g, 695, 310, 845, 310, { color: C.ink, width: 5, dash: '12 8' });
        const qm = txt(g, 770, 270, '？', { size: 40, weight: 800, fill: C.blue });
        const inv = box(g, 855, 255, 360, 110, '翌期の設備投資率', { size: 32 });
        const use = card(g, 140, 470, 1075, 120, '景気を判断する人：企業別の不確実性を毎年測れる', '', C.cyan);
        const verdict = box(g, 140, 640, 1075, 90, 'AI の下書き：今の形のままでは勧めない', { size: 32, stroke: C.red, weight: 700 });
        return t => {
          show(pap, t, T[0]); show(pl, t, T[0] + 0.3);
          drawLine(a1, prog(t, T[1], 0.6)); show(idx, t, T[1] + 0.4);
          drawLine(a2, prog(t, T[2], 0.8)); show(inv, t, T[2] + 0.6); show(qm, t, T[2] + 1);
          show(use, t, T[3]);
          show(verdict, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '追い風も向かい風も、2025年に吹いた', [
        'なぜ今か。追い風が二つあります。',
        '二〇二五年の米国関税で、企業ごとに違う不確実性のショックが起きました。',
        '大規模言語モデルで、日本語の長文を安く分類できます。',
        '向かい風は、同じ方向の研究が、二〇二五年から続けて出たことです。',
        '筆者の見解では、手遅れの理由の方が重いです。',
      ], (g, T) => {
        const head1 = txt(g, 120, 200, '追い風', { size: 32, weight: 700, fill: C.green, anchor: 'start' });
        const c1 = card(g, 120, 240, 680, 150, '2025 年の米国関税', '企業ごとに曝露が違うショック', C.green);
        const c2 = card(g, 120, 420, 680, 150, '日本語の長文を安く分類', '大規模言語モデルで', C.green);
        const head2 = txt(g, 900, 200, '向かい風', { size: 32, weight: 700, fill: C.red, anchor: 'start' });
        const c3 = card(g, 900, 240, 600, 330, '同じ方向の研究が続く', '2025〜2026 年に\n日本の年次報告書で 1 本\n日本銀行のレポートで 1 本', C.red);
        const note = box(g, 120, 620, 1380, 90, '筆者の見解：手遅れの理由の方が重い', { size: 32, stroke: C.yellow, color: C.yellow, weight: 700 });
        return t => {
          show(head1, t, T[0]); show(c1, t, T[1]); show(c2, t, T[2]);
          show(head2, t, T[3]); show(c3, t, T[3] + 0.3);
          show(note, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '日本の年次報告書で、同じ設計が既にある', [
        '米国では、法定開示の文章から、企業別の不確実性が測られています。',
        '日本でも、年次報告書と設備投資を、操作変数つきで見た論文があります。',
        'チェン、木村、井上の二〇二五年の論文です。本文は有料で未読です。',
        '日本銀行も、決算説明会から企業の不確実性を測りました。',
        '符号はどれも同じです。割れているのは、不確実性か悪い知らせかです。',
      ], (g, T) => {
        const tg = tag(g, '読んだ深さ：どれも要旨だけ');
        const h1 = txt(g, 330, 205, '米国', { size: 32, weight: 700, fill: C.gray });
        const h2 = txt(g, 1050, 205, '日本', { size: 32, weight: 700, fill: C.cyan });
        const us = box(g, 120, 240, 420, 130, 'Handley と Li（2020）\n法定開示の文章', { size: 28, stroke: C.gray });
        const ch = box(g, 700, 240, 700, 130, 'Chen・木村・井上（2025）\n年次報告書 × 設備投資 × 操作変数', { size: 28, stroke: C.red });
        const unread = txt(g, 1050, 400, '本文は有料で未読', { size: 28, fill: C.yellow, weight: 700 });
        const boj = box(g, 700, 440, 700, 110, '日本銀行・柴田ほか（2026）\n決算説明会から企業の不確実性', { size: 28, stroke: C.cyan });
        const split = box(g, 120, 600, 1280, 130, '符号はどれも「不確実性が高いと投資は少ない」\n割れる点：不確実性の効果か、悪い知らせの効果か', { size: 30, stroke: C.yellow });
        return t => {
          show(tg, t, T[0]); show(h1, t, T[0]); show(us, t, T[0] + 0.3);
          show(h2, t, T[1]); show(ch, t, T[1] + 0.3);
          show(unread, t, T[2] + 0.6);
          show(boj, t, T[3]);
          dim(us, t, T[4], 0.5);
          show(split, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', 'データは無料だが、10年より前は消える', [
        'データはエディネットから無料で取れます。区分は公開です。',
        'ただし、取れるのは直近の十年分だけです。',
        '二〇一九年の開示拡充の前は、今取っても三年分しか残っていません。',
        'しかも毎年六月に、一年分ずつ消えていきます。',
        'データを取る鍵の発行には、多要素認証が要ります。人が行います。',
      ], (g, T) => {
        const ed = box(g, 120, 190, 900, 80, 'EDINET：無料・T0 公開・公共データ利用規約', { size: 30, stroke: C.cyan });
        // 3月期の決算期 2016〜2025
        const Y = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
        const X = i => 140 + i * 130;
        const cells = Y.map((y, i) => {
          const n = grp(g);
          n.__r = el('rect', { x: X(i), y: 360, width: 110, height: 110, rx: 10, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          return n;
        });
        const cg = grp(g); cells.forEach(c => cg.appendChild(c));
        const yl = grp(g);
        [[0, '2016'], [1, '2017'], [4, '2020'], [9, '2025']].forEach(([i, s]) => txt(yl, X(i) + 55, 330, s, { size: 24, fill: C.mute }));
        const pre = txt(g, X(1) + 185, 510, '改正前：3 年分', { size: 30, fill: C.cyan, weight: 700 });
        const rev = el('line', { x1: X(4) - 10, x2: X(4) - 10, y1: 340, y2: 490, stroke: C.orange, 'stroke-width': 5 }, g);
        const gone = txt(g, X(0) + 55, 560, '取れない', { size: 26, fill: C.red, weight: 700 });
        const next = box(g, 140, 600, 820, 80, '2017 年 3 月期は 2027 年 6 月に消える', { size: 30, stroke: C.red });
        const pp = person(g, 1150, 650, 0.6);
        const key = txt(g, 1230, 650, '鍵の発行は人', { size: 30, fill: C.orange, weight: 700, anchor: 'start' });
        return t => {
          show(ed, t, T[0]);
          show(cg, t, T[1]); show(yl, t, T[1]);
          const p = prog(t, T[1] + 0.3, 1.2);
          cells.forEach((n, i) => {
            const on = i / 10 < p;
            const col = i === 0 ? C.line : i < 4 ? C.cyan : C.blue;
            n.__r.setAttribute('fill', on && i > 0 ? col : C.panel);
            n.__r.setAttribute('stroke', on ? col : C.line);
            n.__r.setAttribute('fill-opacity', i < 4 ? 1 : 0.55);
          });
          show(rev, t, T[2]); show(pre, t, T[2] + 0.4);
          const q = prog(t, T[3], 0.8);
          cells[0].__r.setAttribute('stroke', q > 0 ? C.red : C.line);
          cells[0].__r.setAttribute('stroke-dasharray', q > 0 ? '8 6' : 'none');
          show(gone, t, T[3]); show(next, t, T[3] + 0.6);
          show(pp, t, T[4]); show(key, t, T[4] + 0.3);
        };
      }),

      // 5 外生変動の候補 -------------------------------------------------
      scene('外生変動の候補', 'きれいな外生変動は、見つからなかった', [
        '外生変動の候補を五つ調べました。きれいな候補はありません。',
        '二〇一九年の開示拡充は、不確実性ではなく、書き方を動かします。',
        'つまり、物差しの目盛りが変わるだけです。',
        '曝露の操作変数、災害、米中の貿易摩擦は、悪い知らせが混ざります。',
        'いちばんましなのは、二〇二五年の米国関税への曝露です。',
      ], (g, T) => {
        const term = box(g, 120, 190, 900, 76, '外生変動 = 原因だけを外から動かす出来事', { size: 30, stroke: C.mute, color: C.mute });
        const row = (i, s, col) => {
          const n = grp(g);
          el('rect', { x: 120, y: 300 + i * 92, width: 900, height: 76, rx: 12, fill: C.panel, stroke: col, 'stroke-width': 3 }, n);
          txt(n, 150, 338 + i * 92, s, { size: 28, anchor: 'start' });
          return n;
        };
        const rA = row(0, 'A　2019 年の開示拡充：書き方が動く', C.red);
        const rB = row(1, 'B　曝露の操作変数：水準のショックも運ぶ', C.gray);
        const rC = row(2, 'C　災害：復旧で投資が増え、逆向きに混ざる', C.gray);
        const rD = row(3, 'D　米中の貿易摩擦：関税は費用増そのもの', C.gray);
        const rE = row(4, 'E　2025 年の米国関税：5 つの中でいちばんまし', C.yellow);
        // 目盛りが変わる物差し（文字なしの図）
        const ruler = grp(g);
        el('rect', { x: 1120, y: 330, width: 380, height: 70, rx: 8, fill: C.panel, stroke: C.mute, 'stroke-width': 3 }, ruler);
        const tk1 = [], tk2 = [];
        for (let i = 0; i <= 8; i++) tk1.push(el('line', { x1: 1140 + i * 42.5, x2: 1140 + i * 42.5, y1: 330, y2: i % 2 ? 355 : 370, stroke: C.mute, 'stroke-width': 3 }, ruler));
        const ruler2 = grp(g);
        el('rect', { x: 1120, y: 470, width: 380, height: 70, rx: 8, fill: C.panel, stroke: C.orange, 'stroke-width': 3 }, ruler2);
        for (let i = 0; i <= 16; i++) tk2.push(el('line', { x1: 1140 + i * 21.25, x2: 1140 + i * 21.25, y1: 470, y2: i % 2 ? 490 : 505, stroke: C.orange, 'stroke-width': 3 }, ruler2));
        const ra = arrow(g, 1310, 410, 1310, 460, { color: C.orange, width: 4 });
        const hyp = txt(g, 1050, 706, '← まだ仮説の段階', { size: 26, fill: C.yellow, weight: 700, anchor: 'start' });
        return t => {
          show(term, t, T[0]);
          show(rA, t, T[1]);
          show(ruler, t, T[2]); drawLine(ra, prog(t, T[2] + 0.5, 0.6)); show(ruler2, t, T[2] + 1);
          show(rB, t, T[3]); show(rC, t, T[3] + 0.6); show(rD, t, T[3] + 1.2);
          dim(rA, t, T[3], 0.45);
          show(rE, t, T[4]); show(hyp, t, T[4] + 0.8);
          dim(ruler, t, T[4], 0.3); dim(ruler2, t, T[4], 0.3); dim(ra, t, T[4], 0.3);
          [rB, rC, rD].forEach(n => dim(n, t, T[4], 0.45));
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '同じ問いの論文が1本、隣に4〜5チーム', [
        '最大の競合は、チェンらのグループです。ほぼ同じ問いです。',
        '同じグループは、次の論文に向けた注釈つきデータも作っています。',
        '日本銀行の分析はマクロの時系列ですが、続報が出れば重なります。',
        '関税の案には、独自の企業調査で先を行く研究があります。',
        '残る差が何かは、チェンらの本文を読むまで分かりません。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 470, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 650), ln(1270, 650)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 470, r: 115, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 470, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 215, y - 60, 430, 120, s, { size: 27, stroke: col });
        const ch = node(330, 290, 'Chen・木村・井上（2025）\nほぼ同じ問い', C.red);
        const cc = node(1270, 290, '同じグループ\n注釈つきデータを準備', C.red);
        const bj = node(330, 650, '日本銀行（2026）\nマクロの時系列', C.gray);
        const it = node(1270, 650, '伊藤・神事・直井（2026）\n関税・独自の企業調査', C.gray);
        const unread = box(g, 600, 180, 400, 70, '残る差：本文を読むまで不明', { size: 26, stroke: C.yellow, color: C.yellow });
        return t => {
          show(me, t, 0.3);
          [T[0], T[1], T[2], T[3]].forEach((a, i) => { show(l[i], t, a); });
          show(ch, t, T[0]); show(cc, t, T[1]); show(bj, t, T[2]); show(it, t, T[3]);
          show(unread, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '先行と重なれば、着手前にやめる', [
        '着手の前に、人がチェンらの本文を読みます。重なればここでやめます。',
        '一か月目に、節と設備投資が九割で取れなければやめます。',
        '二か月目に、人の判定との一致が八割に届かなければやめます。',
        '三か月目に、曝露を作れる企業が五百社に届かなければやめます。',
        '四か月目にロックし、二〇二五年度の報告書で推定します。',
      ], (g, T) => {
        const M = ['本文\n鍵', '全件\n取得', '指標\n照合', '曝露\n検出力', 'ロック\n推定', '頑健性', '原稿'];
        const X = i => 90 + i * 205;
        const months = M.map((s, i) => {
          const n = grp(g);
          el('rect', { x: X(i), y: 200, width: 185, height: 130, rx: 14, fill: C.panel, stroke: i === 0 ? C.orange : C.line, 'stroke-width': 3 }, n);
          txt(n, X(i) + 92, 225, i === 0 ? '着手前' : `${i} か月`, { size: 24, fill: C.mute });
          txt(n, X(i) + 92, 285, s, { size: 28, weight: 700 });
          return n;
        });
        const back = grp(g);
        const stop = (i, y, s) => {
          const n = grp(g);
          n.__line = el('line', { x1: X(i) + 92, x2: X(i) + 92, y1: 335, y2: y - 35, stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
          box(n, Math.min(X(i) + 72, 530), y - 35, 980, 70, s, { size: 27, stroke: C.red });
          return n;
        };
        const s0 = stop(0, 425, 'Chen らが同じ節・期間・曝露型の操作変数 → やめる');
        const s1 = stop(1, 515, '節と設備投資の両方が取れるのが 9 割未満 → やめる');
        const s2 = stop(2, 605, '500 文で人の判定との一致が 8 割未満 → やめる');
        const s3 = stop(3, 695, '曝露を作れる企業が 500 社未満 → やめる');
        const lk = lock(g, X(4) + 92, 150, 0.5);
        return t => {
          const cur = t < T[1] ? 0 : t < T[2] ? 1 : t < T[3] ? 2 : t < T[4] ? 3 : 4;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.2); n.setAttribute('opacity', p * (t < T[0] || i === cur ? 1 : 0.4)); });
          [[s0, T[0]], [s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「今の形では勧めない」', [
        'AIの下書きは、今の形のままでは勧めない、です。',
        '勝ち筋は、問いを二〇二五年の関税への曝露に変えることです。',
        '懸念は、文章の指標が、悪い知らせと不確実性を分けられないことです。',
        'チェンらの本文を読んで差が残るか。問いを変えてでも書くか。',
        '消えていく十年分を、今のうちに落とすか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：今の形のままでは勧めない', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '問いを 2025 年の米国関税への曝露に変える\n文章は経路を測る物差し（筆者の見解）', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '文章の指標は、悪い知らせと\n不確実性を分けられない', C.red);
        const qh = box(g, 960, 320, 540, 380, '', { stroke: C.orange });
        const qt = txt(g, 1230, 370, '人が決めること', { size: 30, weight: 700, fill: C.orange });
        const q1 = txt(g, 1000, 450, '本文を読み、差が残るか', { size: 28, anchor: 'start' });
        const q2 = txt(g, 1000, 530, '問いを変えてでも書くか', { size: 28, anchor: 'start' });
        const q3 = txt(g, 1000, 610, '消える10年分を今落とすか', { size: 28, anchor: 'start' });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(qh, t, T[3]); show(qt, t, T[3] + 0.2);
          show(q1, t, T[3] + 0.5); show(q2, t, T[3] + 2.5); show(q3, t, T[4]);
        };
      }),
    ],
  });
})();
