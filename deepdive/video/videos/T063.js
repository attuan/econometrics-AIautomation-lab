// T063 製品の文章と画像から特性を作る需要推定 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T063.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T063', title: '文章と画像から作る需要推定', subtitle: '埋め込みで、客の移り先を正しく推定できるか',
    hook: '中心の問いには、査読誌で答えが出ていました。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '埋め込みで、客の移り先を推定できるか', [
        'テーマは、製品の文章と画像を使う需要推定です。',
        '製品の説明や画像を、埋め込みというベクトルにします。',
        'それを、手で集めた製品特性の代わりに使います。',
        '知りたいのは代替のパターン。値上げで客がどこへ移るかです。',
        '埋め込みで、それを正しく推定できるか。それが問いです。',
      ], (g, T) => {
        const doc = paper(g, 150, 230, 1.1);
        const ld = txt(g, 196, 390, '説明・画像', { size: 28, fill: C.cyan });
        const vec = box(g, 380, 230, 300, 110, '埋め込み', { size: 34, stroke: C.cyan });
        const a1 = arrow(g, 260, 285, 372, 285, { color: C.cyan, width: 5 });
        const hand = box(g, 380, 380, 300, 90, '手で集めた特性', { size: 28, stroke: C.gray, color: C.mute });
        const cross = el('line', { x1: 400, x2: 660, y1: 425, y2: 425, stroke: C.gray, 'stroke-width': 4 }, g);
        const term = box(g, 150, 520, 600, 110, '埋め込み = 文章や画像を\n数の並びにしたもの', { size: 28, stroke: C.mute, color: C.mute });
        // 代替のパターン（模式図）
        const ex = tag(g, '例（架空の模式図）');
        const back = grp(g);
        const prod = (x, y, s, col) => { const n = grp(g); el('circle', { cx: x, cy: y, r: 62, fill: C.panel, stroke: col, 'stroke-width': 5 }, n); txt(n, x, y, s, { size: 30, weight: 700, fill: col }); return n; };
        const pa = prod(1000, 300, '製品A', C.blue);
        const pb = prod(1360, 260, '製品B', C.gray);
        const pc = prod(1300, 560, '製品C', C.gray);
        const ab = arrow(back, 1066, 292, 1290, 266, { color: C.blue, width: 9 });
        const ac = arrow(back, 1050, 345, 1250, 515, { color: C.blue, width: 3 });
        const up = txt(g, 1000, 410, '値上げ', { size: 28, fill: C.red, weight: 700 });
        const q = box(g, 150, 660, 1330, 100, '問い：埋め込みで、代替のパターンを正しく推定できるか', { size: 32, stroke: C.blue, weight: 700 });
        return t => {
          show(doc, t, T[0]); show(ld, t, T[0]);
          drawLine(a1, prog(t, T[1], 0.8)); show(vec, t, T[1] + 0.6); show(term, t, T[1] + 1, T[4]);
          show(hand, t, T[2]); show(cross, t, T[2] + 1);
          show(ex, t, T[3]); show(pa, t, T[3]); show(pb, t, T[3] + 0.3); show(pc, t, T[3] + 0.3);
          show(up, t, T[3] + 0.8); drawLine(ab, prog(t, T[3] + 1.4, 0.8)); drawLine(ac, prog(t, T[3] + 1.8, 0.8));
          show(q, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '埋め込みは安くなった。だが先行は速い', [
        'なぜ今だったのか。埋め込みのモデルが、安く使えるようになったからです。',
        'ところが、二〇二五年三月に、中心の論文が出ました。',
        '二〇二六年には、査読誌に載ったとされます。',
        '追随する論文も、二〇二五年から二〇二六年に続きました。',
        'データ構築で先行できる、という前提は成り立ちません。',
      ], (g, T) => {
        const cheap = box(g, 120, 200, 560, 100, '埋め込みが安く使える', { size: 32, stroke: C.purple });
        const back = grp(g);
        el('line', { x1: 160, x2: 1440, y1: 420, y2: 420, stroke: C.mute, 'stroke-width': 3 }, back);
        const ev = (x, y, s, col) => {
          const n = grp(g);
          el('circle', { cx: x, cy: 420, r: 12, fill: col }, n);
          el('line', { x1: x, x2: x, y1: 432, y2: y - 46, stroke: col, 'stroke-width': 3 }, n);
          box(n, x - 180, y - 46, 360, 92, s, { size: 26, stroke: col });
          return n;
        };
        const e1 = ev(340, 520, '2025年3月 arXiv\nCompiani ほか', C.cyan);
        const e2 = ev(760, 520, '2026年 査読誌とされる\n出版社のページは未確認', C.yellow);
        const e3 = ev(1200, 520, '追随 2025〜2026\nChristensen ほか', C.cyan);
        const no = box(g, 120, 650, 1360, 100, '一次採点の前提「データ構築で先行できる」は成り立たない', { size: 32, stroke: C.red, weight: 700 });
        return t => {
          show(cheap, t, T[0]); show(back, t, T[1]);
          show(e1, t, T[1]); show(e2, t, T[2]); show(e3, t, T[3]);
          dim(cheap, t, T[1], 0.5);
          show(no, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '埋め込みは効く。ただし補正が要るとの主張も', [
        '中心は、コンピアーニ、モロゾフ、ザイラーの論文です。',
        '本の選択実験、九千二百六十五人で、第二選択の予測を比べました。',
        '単純なロジットと比べた誤差の改善は、レビュー文の埋め込みで二十三パーセント。',
        '手で集めた特性では、十一・七パーセント。区間は確かめられていません。',
        '一方で、埋め込みが不完全だと偏る、という論文も出ています。',
      ], (g, T) => {
        const X = v => 600 + v * 32;                     // 0 → 600, 25% → 1400
        const tg = tag(g, '実験データ（Compiani ほか 本文 v4。区間は未確認）');
        const term = box(g, 120, 190, 1100, 76, '第2選択 = 1番目の製品が無いときに選ぶ製品', { size: 30, stroke: C.mute, color: C.mute });
        const ax = grp(g);
        el('line', { x1: X(0), x2: X(0), y1: 330, y2: 590, stroke: C.mute, 'stroke-width': 3 }, ax);
        txt(ax, X(0), 320 - 12, '単純なロジットからの改善', { size: 24, fill: C.mute, anchor: 'start' });
        const bar = (y, v, col, label, val) => {
          const n = grp(g);
          const r = el('rect', { x: X(0), y: y - 22, width: X(v) - X(0), height: 44, rx: 8, fill: col }, n);
          txt(n, 570, y, label, { size: 28, anchor: 'end' });
          const vt = txt(n, X(v) + 14, y, val, { size: 28, fill: col, anchor: 'start', weight: 700 });
          n.__r = r; n.__w = X(v) - X(0); n.__v = vt; return n;
        };
        const b1 = bar(400, 23, C.blue, 'レビュー文の埋め込み', '23%');
        const b2 = bar(510, 11.7, C.gray, '特性の混合ロジット', '11.7%');
        const split = box(g, 120, 640, 1360, 110, '割れている点：埋め込みをそのまま使えるか、補正が要るか\n補正派は Christensen・Compiani（2026）。本文は前半だけ読んだ', { size: 28, stroke: C.yellow });
        return t => {
          show(tg, t, T[1]); show(term, t, T[1]);
          show(ax, t, T[2]);
          [[b1, T[2] + 0.5], [b2, T[3]]].forEach(([b, a]) => {
            show(b, t, a);
            b.__r.setAttribute('width', Math.max(0.1, b.__w * prog(t, a, 1.2)));
            b.__v.setAttribute('opacity', prog(t, a + 1.1, 0.3));
          });
          show(split, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '数量と文章が公開でそろうのは小さなものだけ', [
        '数量と文章の両方が公開でそろうデータは、小さいものだけでした。',
        '原著の実験データは、今日、無料で手に入ります。',
        'ドミニクスの店舗データは、商品名が略語だけです。',
        'アマゾンのレビューには、販売数量がありません。',
        'ニールセンは、許可のない機械学習やAIでの処理を禁じています。',
      ], (g, T) => {
        const W = [400, 420, 460], XS = [160, 560, 980];
        const tb = table(g, 160, 200, 3, 5, 420, 80);
        tb.rect.forEach((row, r) => row.forEach((rc, c) => { rc.setAttribute('x', XS[c]); rc.setAttribute('width', W[c]); }));
        const cx = c => XS[c] + W[c] / 2;
        const head = ['データ', '中身', '入手・区分'];
        const rows = [
          ['原著の実験データ', '9,265人・本の選択', '今日・無料・T0'],
          ["Dominick's", '約100店・1989〜1994', '商品名は略語・T0'],
          ['Amazon Reviews 2023', '販売数量は無い', '利用条件は未確認'],
          ['NielsenIQ', '1データ 3,000〜4,000ドル', 'T1・AI 処理は許可制'],
        ];
        const warnCol = [[false, false, false], [false, true, false], [false, true, true], [false, false, true]];
        const hd = grp(g); head.forEach((s, c) => txt(hd, cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, cx(c), tb.cy(i + 1), s, { size: 26, fill: warnCol[i][c] ? (i === 3 ? C.red : C.yellow) : C.ink })); return n; });
        const hi = el('rect', { x: 160, y: 280, width: 1280, height: 80, rx: 6, fill: 'none', stroke: C.cyan, 'stroke-width': 5 }, g);
        const ai = box(g, 160, 640, 1280, 100, 'NielsenIQ の規約：許可のない機械学習・AI での処理を禁止\n例外は事前の書面同意。ラボの進め方とぶつかる', { size: 28, stroke: C.red });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          rg.forEach((n, i) => show(n, t, T[i + 1]));
          const row = t < T[2] ? 0 : t < T[3] ? 1 : t < T[4] ? 2 : 3;
          hi.setAttribute('y', 280 + row * 80);
          hi.setAttribute('opacity', prog(t, T[1], 0.4));
          show(ai, t, T[4] + 0.8);
        };
      }),

      // 5 識別の源 -------------------------------------------------------
      scene('識別の源', '代替は、第2選択か製品の出入りで決まる', [
        '代替のパターンを決めるのは、第二選択の情報です。',
        '実験データでは、第一選択で推定し、第二選択を検証に取り置きます。',
        '集計データでは、製品の出入りが変動の源になります。',
        '価格の係数には操作変数が要りますが、そこに代理の誤差が入ります。',
        'その場合の理論は、まだありません。代理が十分かは、診断で確かめます。',
      ], (g, T) => {
        const back = grp(g);
        const s1 = box(g, 120, 200, 560, 110, '個票：第2選択\n（原著の実験データ）', { size: 28, stroke: C.cyan });
        const s2 = box(g, 120, 350, 560, 110, '集計：製品の出入り\n（Dominick\'s）', { size: 28, stroke: C.cyan });
        const s3 = box(g, 120, 500, 560, 110, '費用・利幅・操作変数', { size: 28, stroke: C.cyan });
        const p1 = box(g, 920, 270, 560, 120, 'ランダム係数\n＝代替のパターン', { size: 30, stroke: C.blue, weight: 700 });
        const p2 = box(g, 920, 500, 560, 110, '価格の係数', { size: 30, stroke: C.blue, weight: 700 });
        const hold = txt(g, 400, 168, '第2選択は検証に取り置く', { size: 26, fill: C.green });
        const a1 = arrow(back, 685, 255, 912, 315, { color: C.cyan, width: 4 });
        const a2 = arrow(back, 685, 405, 912, 345, { color: C.cyan, width: 4 });
        const a3 = arrow(back, 685, 555, 912, 555, { color: C.cyan, width: 4 });
        const err = box(g, 120, 650, 680, 100, '操作変数に代理の誤差\n理論は未対応と著者が明記', { size: 28, stroke: C.red });
        const diag = box(g, 840, 650, 640, 100, '診断 LM1・LM2\n＝埋め込みが代理として十分か', { size: 28, stroke: C.purple });
        return t => {
          show(s1, t, T[0]); show(p1, t, T[0] + 0.6); drawLine(a1, prog(t, T[0] + 0.3, 0.8));
          show(hold, t, T[1]);
          show(s2, t, T[2]); drawLine(a2, prog(t, T[2] + 0.3, 0.8));
          dim(s1, t, T[3], 0.5); dim(s2, t, T[3], 0.5); dim(p1, t, T[3], 0.5); dim(hold, t, T[3], 0.5);
          show(s3, t, T[3]); show(p2, t, T[3] + 0.6); drawLine(a3, prog(t, T[3] + 0.3, 0.8));
          show(err, t, T[3] + 1.5);
          show(diag, t, T[4] + 1.5);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '原著者が、手法もデータも道具も持つ', [
        '原著者は、査読論文、公式パッケージ、実験データを持っています。',
        '偏りの補正と診断も、二〇二六年に同じ著者が出しました。',
        '日本では、日本銀行の論文が、商品名の文章解析で需要を推定しています。',
        'アマゾンやエイチアンドエムの公開データでの実証も、済んでいます。',
        '空いているのは、集計データ用の実装だけです。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 425, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 270), ln(1270, 270), ln(330, 580), ln(1270, 580)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 425, r: 110, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 425, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 220, y - 55, 440, 110, s, { size: 28, stroke: col });
        const cm = node(330, 270, 'Compiani ほか\n論文・DeepLogit・データ', C.red);
        const cc = node(1270, 270, 'Christensen・Compiani\n補正と診断・集計にも', C.red);
        const bj = node(330, 580, 'Todoroki・Otaka（日銀）\n代替のパターンは扱わない', C.gray);
        const ot = node(1270, 580, 'Rawat・Bach ほか\n公開データで実証済み', C.gray);
        const gap = box(g, 400, 680, 800, 80, '空き：集計データ用の実装（PyBLP 側）', { size: 30, stroke: C.green, weight: 700 });
        return t => {
          show(me, t, 0.3);
          [T[0], T[1], T[2], T[3]].forEach((a, i) => { show(l[i], t, a); });
          show(cm, t, T[0]); show(cc, t, T[1]); show(bj, t, T[2]); show(ot, t, T[3]);
          show(gap, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '縮小版：再現できなければ1か月で止める', [
        '進めるなら縮小版です。型は追試と拡張、成果はライブラリです。',
        '一か月目、原著の二十三パーセントを再現できなければ止めます。',
        '二か月目までに原著者が同じコードを出したら、止めます。',
        '三か月目、補正しても被覆率が九割に届かない設定が多ければ、式を疑います。',
        '二か月目の終わり、販売数量を見る前に、ロックします。',
      ], (g, T) => {
        const M = ['再現', '補正の実装\nロック', "Dominick's", '埋め込み\n比較', '公開準備\n監査', '原稿'];
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
        const s1 = stop(0, 430, '23% を ±5 ポイントで再現できない → 止める');
        const s2 = stop(1, 545, '原著者が集計データ用のコードを公開 → 止める');
        const s3 = stop(2, 660, '補正後も 90% 未満が半分以上 → 人が式を確かめる');
        const lk = lock(g, X(1) + 100, 150, 0.5);
        return t => {
          const cur = t < T[1] ? -1 : t < T[2] ? 0 : t < T[3] ? 1 : t < T[4] ? 2 : 1;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (cur < 0 || i === cur ? 1 : 0.4)); });
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「元の形では勧めない」', [
        'AIの下書きは、元の形では着手を勧めない、です。',
        '勝ち筋は、公開データだけで、補正と診断の道具を作ることです。',
        '懸念は、原著者がその道具を出せば、価値が消えることです。',
        '縮小版を残すか。ニールセンの書面同意を取りに行くか。',
        '日本のデータを問い合わせるか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：元の形では勧めない', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', 'PyBLP につなぐ補正と診断\n公開データだけで今日から', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '原著者が出せば終わる\n理論・データ・道具をすべて持つ', C.red);
        const q = box(g, 960, 320, 540, 380, '人が決めること\n\n縮小版を残す価値があるか\nNielsenIQ の書面同意を\n取りに行くか\n日本のデータを問い合わせるか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
