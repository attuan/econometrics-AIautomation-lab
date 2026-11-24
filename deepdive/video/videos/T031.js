// T031 LLM が作った変数を回帰に使うときの測定誤差の補正 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T031.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」、予想は「予想（筆者の仮定）」と出す。
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
  // データ座標の折れ線（drawLine で伸ばせる）
  const curve = (g, ax, pts, col, w = 5) => el('path', { d: 'M' + pts.map(([x, y]) => `${ax.X(x)},${ax.Y(y)}`).join(' L'), stroke: col, 'stroke-width': w, fill: 'none' }, g);

  VIDEO({
    id: 'T031', title: 'LLM 変数の測定誤差の補正', subtitle: '機械が付けたラベルで回帰すると、どれだけ偏るか',
    hook: '補正の手法は、もう出そろっていました。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '機械が付けたラベルで、回帰は偏る', [
        'テーマは、大規模言語モデルが作った変数を回帰に使う問題です。',
        '文章を読ませて、ラベルや点数を付けさせます。',
        'ラベルの誤りは測定誤差になり、推定値を偏らせます。',
        'どの補正を、どの条件で使えばよいか。それが問いです。',
        'AIの下書きは、条件つきで勧める、です。元の構想のままなら勧めません。',
      ], (g, T) => {
        const pap = paper(g, 130, 260, 1.1);
        const a1 = arrow(g, 240, 320, 330, 320, { color: C.cyan, width: 5 });
        const llm = computer(g, 450, 320, 0.9, 'LLM');
        const a2 = arrow(g, 540, 320, 630, 320, { color: C.purple, width: 5 });
        const lab = box(g, 640, 265, 260, 110, 'ラベル・点数', { size: 30, stroke: C.purple });
        const term = box(g, 120, 450, 880, 80, '測定誤差 = 測った値と、真の値のずれ', { size: 30, stroke: C.mute, color: C.mute });
        const ex = tag(g, '例（架空の模式図）');
        const truth = el('line', { x1: 1250, x2: 1250, y1: 230, y2: 430, stroke: C.green, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, g);
        const tl = txt(g, 1250, 206, '真の値', { size: 26, fill: C.green, weight: 700 });
        const cb = coef(g, 1250, 340, 100, -1.6, -2.3, -0.9, C.red);
        const bl = txt(g, 1090, 390, '補正なしの推定', { size: 26, fill: C.red });
        const q = box(g, 120, 560, 1340, 80, '問い：どの補正を、どの条件で使えばよいか', { size: 32, stroke: C.blue, weight: 700 });
        const verdict = box(g, 120, 670, 1340, 90, 'AI の下書き：条件つきで勧める（元の構想のままなら勧めない）', { size: 30, stroke: C.purple, weight: 700 });
        return t => {
          show(pap, t, T[0] + 0.3);
          drawLine(a1, prog(t, T[1], 0.6)); show(llm, t, T[1] + 0.4);
          drawLine(a2, prog(t, T[1] + 1, 0.6)); show(lab, t, T[1] + 1.4);
          show(term, t, T[2]); show(ex, t, T[2] + 0.6); show(truth, t, T[2] + 0.6); show(tl, t, T[2] + 0.6);
          show(cb, t, T[2] + 1.4); show(bl, t, T[2] + 1.4);
          dim(term, t, T[3], 0.4);
          show(q, t, T[3]);
          show(verdict, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '誤った結論の報告が続き、補正は乱立した', [
        '既存研究の再現で、誤った結論が頻発すると報告されました。',
        '三十七課題、二十一研究の再現です。割合は本文未確認です。',
        'モデルやプロンプトを変えると、係数の符号まで変わる報告もあります。',
        '補正の手法は、二〇二三年以降に急増しました。',
        '系統は五つに分かれ、選べない状態です。これは筆者の見解です。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 700, 170, 'Baumann ほか（2025）', '37 課題・21 研究の再現で誤りが頻発\n要約のみ確認。割合は書かない', C.red);
        const c2 = card(g, 120, 410, 700, 170, 'Ludwig ほか（2025）', 'モデルやプロンプトを変えると\n係数の符号・大きさ・有意性が変わる', C.red);
        const fam = grp(g);
        'ABCDE'.split('').forEach((s, i) => {
          const y = 210 + i * 76;
          el('rect', { x: 1000, y, width: 300, height: 60, rx: 12, fill: C.panel, stroke: C.cyan, 'stroke-width': 3 }, fam);
          txt(fam, 1150, y + 30, '系統 ' + s, { size: 28 });
        });
        const ft = txt(g, 1150, 180 - 6, '2023 年以降に急増', { size: 26, fill: C.cyan, weight: 700 });
        const note = box(g, 900, 610, 500, 100, '選べない（筆者の見解）', { size: 32, stroke: C.yellow, color: C.yellow, weight: 700 });
        return t => {
          show(c1, t, T[0]); show(c2, t, T[2]);
          dim(c1, t, T[3], 0.5); dim(c2, t, T[3], 0.5);
          show(ft, t, T[3]); show(fam, t, T[3] + 0.4);
          show(note, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '補正は5系統。人手ラベルの要否で割れる', [
        '補正の手法は、五つの系統に分かれます。',
        '検証標本とは、人が正解ラベルを付けた小さな標本のことです。',
        '三つの系統は、検証標本を必要とします。',
        '一方、同時推定や操作変数の系統は、検証標本が要りません。',
        '検証標本は必須か。操作変数型は妥当か。ここで意見が割れています。',
      ], (g, T) => {
        const tb = table(g, 120, 190, 2, 6, 560, 76);
        const rows = [
          ['A 偏り補正・同時推定', '少数、または不要', C.yellow],
          ['B 設計にもとづく補正', '必要', C.cyan],
          ['C 予測を使った推論', '必要', C.cyan],
          ['D 検証標本で回帰補正', '必要', C.cyan],
          ['E 操作変数', '不要', C.yellow],
        ];
        const hd = grp(g);
        txt(hd, tb.cx(0), tb.cy(0), '系統', { size: 28, weight: 700 });
        txt(hd, tb.cx(1), tb.cy(0), '検証標本', { size: 28, weight: 700 });
        const rg = rows.map((r, i) => {
          const n = grp(g);
          txt(n, 150, tb.cy(i + 1), r[0], { size: 28, anchor: 'start' });
          n.__need = txt(n, tb.cx(1), tb.cy(i + 1), r[1], { size: 28, fill: r[2], weight: 700 });
          return n;
        });
        const term = box(g, 1290, 190, 250, 300, '検証標本\n=\n人が正解を\n付けた\n小さな標本', { size: 28, stroke: C.mute, color: C.mute });
        const split = card(g, 1290, 520, 250, 140, '割れる点', '', C.red);
        const sp = txt(g, 1415, 700, '必須か・妥当か', { size: 26, fill: C.red, weight: 700 });
        const hiNeed = el('rect', { x: 120, y: 190 + 76 * 2, width: 1120, height: 76 * 3, rx: 6, fill: 'none', stroke: C.cyan, 'stroke-width': 5 }, g);
        const hiNo = grp(g);
        el('rect', { x: 120, y: 190 + 76, width: 1120, height: 76, rx: 6, fill: 'none', stroke: C.yellow, 'stroke-width': 5 }, hiNo);
        el('rect', { x: 120, y: 190 + 76 * 5, width: 1120, height: 76, rx: 6, fill: 'none', stroke: C.yellow, 'stroke-width': 5 }, hiNo);
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          rg.forEach((n, i) => show(n, t, T[0] + 0.5 + i * 0.4));
          rg.forEach(n => n.__need.setAttribute('opacity', prog(t, T[2] - 0.3, 0.5)));
          show(term, t, T[1]);
          hiNeed.setAttribute('opacity', Math.min(prog(t, T[2], 0.4), 1 - prog(t, T[3], 0.4)));
          hiNo.setAttribute('opacity', Math.min(prog(t, T[3], 0.4), 1 - prog(t, T[4], 0.4)));
          show(split, t, T[4]); show(sp, t, T[4] + 0.3);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '公開データで足り、申請は要らない', [
        '主役は合成データで、実データは例示と照合に使います。',
        '公開データが四つあり、着手にはこれで足ります。',
        'どれも即日、無料で、区分は公開です。申請は要りません。',
        '先行研究の適用例の元データには、購入が要るものがあります。',
        '元のデータごとの利用条件は、まだ確かめていません。',
      ], (g, T) => {
        const sim = box(g, 120, 200, 1340, 80, '主役：合成データ（自作）　実データ：例示と照合', { size: 30, stroke: C.purple, weight: 700 });
        const tb = table(g, 120, 310, 2, 5, 670, 70);
        const hd = grp(g);
        txt(hd, tb.cx(0), tb.cy(0), '公開データ', { size: 28, weight: 700 });
        txt(hd, tb.cx(1), tb.cy(0), '中身', { size: 28, weight: 700 });
        const rows = [['LLM hacking の再現データ', '37 課題・正解ラベルつき'], ['EMNLP 比較のデータ', '4 データ'], ['MLBC 同梱データ', '求人票・トピックモデル'], ['ppi_py の例示データ', '国勢調査の所得など']];
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 27 })); return n; });
        const meta = box(g, 120, 680, 1340, 80, '入手：即日　費用：無料　区分：T0 公開　申請：不要', { size: 30, stroke: C.cyan });
        const buy = box(g, 120, 680, 650, 80, '適用例の元：購入データ（T1）', { size: 28, stroke: C.red });
        const lic = box(g, 810, 680, 650, 80, '元データの利用条件：未確認', { size: 28, stroke: C.yellow, color: C.yellow });
        return t => {
          show(sim, t, T[0]);
          show(tb.g, t, T[1]); show(hd, t, T[1]);
          rg.forEach((n, i) => show(n, t, T[1] + 0.4 + i * 0.4));
          show(meta, t, T[2], T[3] - 0.3);
          show(buy, t, T[3]); show(lic, t, T[4]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('手法の候補', '同じ土俵で、どれがどこで壊れるかを見る', [
        '手法のテーマなので、シミュレーションで性質を確かめます。',
        '誤分類率を、一パーセントから二十パーセントまで動かします。',
        '誤りの構造、検証標本の大きさ、固定効果やクラスタも動かします。',
        '評価するのは、偏り、被覆率、区間の幅、計算時間などです。',
        '予想は、全設定で被覆を保つ手法は無い、です。筆者の仮定です。',
      ], (g, T) => {
        const ex = tag(g, '予想（筆者の仮定）・例（架空の模式図）');
        const ax = axes(g, 200, 230, 660, 420, [0, 20], [0.5, 1.0], { xlabel: '誤分類率（%）', ylabel: '被覆率' });
        const ticks = grp(g);
        [1, 5, 10, 20].forEach(v => txt(ticks, ax.X(v), ax.Y(0.5) + 70, String(v), { size: 24, fill: C.mute }));
        const nom = fitline(g, ax, 0, 0.95, 20, 0.95, C.green, 3); nom.setAttribute('stroke-dasharray', '10 8');
        const nl = txt(g, ax.X(20) + 12, ax.Y(0.95), '名目 95%', { size: 24, fill: C.green, anchor: 'start' });
        const raw = curve(g, ax, [[1, 0.9], [5, 0.75], [10, 0.62], [20, 0.52]], C.red);
        const rl = txt(g, ax.X(10), ax.Y(0.56), '補正なし', { size: 26, fill: C.red });
        const m1 = curve(g, ax, [[1, 0.95], [5, 0.94], [10, 0.92], [20, 0.84]], C.blue);
        const m2 = curve(g, ax, [[1, 0.94], [5, 0.95], [10, 0.94], [20, 0.93]], C.gray);
        const ml = txt(g, ax.X(14), ax.Y(0.80), '補正の各系統', { size: 26, fill: C.blue });
        const k1 = card(g, 1040, 240, 500, 170, '動かす軸', '誤りの構造・検証標本の大きさ\n固定効果・クラスタ', C.purple);
        const k2 = card(g, 1040, 440, 500, 170, '評価指標', '偏り・被覆率・区間の幅\n計算時間・失敗率', C.purple);
        const p2 = box(g, 1040, 640, 500, 90, '予想：全設定で保つ手法は無い', { size: 28, stroke: C.yellow, color: C.yellow });
        return t => {
          show(ex, t, T[0]); show(ax.g, t, T[0] + 0.3); show(nom, t, T[0] + 0.6); show(nl, t, T[0] + 0.6);
          show(ticks, t, T[1]); drawLine(raw, prog(t, T[1] + 0.5, 1.4)); show(rl, t, T[1] + 1.4);
          show(k1, t, T[2]);
          show(k2, t, T[3]);
          drawLine(m1, prog(t, T[4], 1.2)); drawLine(m2, prog(t, T[4] + 0.3, 1.2)); show(ml, t, T[4] + 1);
          show(p2, t, T[4] + 0.6);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '元の構想は、もう済んでいる', [
        'ここが結論を決めました。元の構想は、既に済んでいます。',
        'バッタリアらは、理論、パッケージ、実務指針まで出しています。',
        'いちばん近い比較は、二つの系統を、結果変数だけで比べたものです。',
        '統一の枠組みの席は、カールソンとデルが既に取っています。',
        '公開パッケージも、RとPythonに少なくとも七つあります。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 470, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 650), ln(1270, 650)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 470, r: 115, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 470, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 215, y - 60, 430, 120, s, { size: 27, stroke: col });
        const done = box(g, 560, 180, 480, 70, '元の構想：済んでいる', { size: 30, stroke: C.red, color: C.red, weight: 700 });
        const ba = node(330, 290, 'Battaglia ほか\n理論・パッケージ・指針', C.red);
        const au = node(1270, 290, 'Audinet de Pieuchon ほか\n2系統・結果変数だけ', C.red);
        const cd = node(330, 650, 'Carlson と Dell\n統一の枠組み', C.gray);
        const pk = node(1270, 650, '公開パッケージ\nR と Python に 7 つ以上', C.gray);
        return t => {
          show(me, t, 0.3); show(done, t, T[0]);
          [T[1], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(ba, t, T[1]); show(au, t, T[2]); show(cd, t, T[3]); show(pk, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '比較が既にあれば、1か月で止める', [
        '一か月目は、文献を整理し、七つのパッケージで例を再現します。',
        '説明変数側の比較が既にあると分かれば、撤退します。',
        '二か月目に、一つの手法が常に勝つなら、短い報告で終えます。',
        '手法の差がシミュレーションの誤差に収まれば、撤退します。',
        '三か月目に、結果を見る前の論文を書き、ロックします。',
      ], (g, T) => {
        const M = ['文献\n再現', '共通の\n入口', '結果前\nロック', '全\n実験', '診断\n文書', '監査\n初稿'];
        const X = i => 170 + i * 220;
        const months = M.map((s, i) => {
          const n = grp(g);
          el('rect', { x: X(i), y: 200, width: 200, height: 130, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          txt(n, X(i) + 100, 225, `${i + 1} か月`, { size: 24, fill: C.mute });
          txt(n, X(i) + 100, 285, s, { size: 28, weight: 700 });
          return n;
        });
        const back = grp(g);
        const stop = (i, y, s, col = C.red) => {
          const n = grp(g);
          n.__line = el('line', { x1: X(i) + 100, x2: X(i) + 100, y1: 335, y2: y - 40, stroke: col, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
          box(n, X(i) + 80, y - 40, 1000, 80, s, { size: 27, stroke: col });
          return n;
        };
        const s1 = stop(0, 440, '説明変数側で 3 系統以上の比較が既にある → 撤退');
        const s2 = stop(1, 560, '1 手法が常に被覆率 93% 以上・幅も最短 → 短い報告');
        const s3 = stop(1, 680, '差が誤差（約 1.4 ポイント）に収まる → 撤退');
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
        '勝ち筋は、五つの系統を同じ土俵で比べ、一つの入口の道具にすることです。',
        '懸念は、有力なチームが密集し、比較も先に埋まるおそれです。',
        '新しい推定量ではなく、比較と道具を成果と認めるか。',
        'テーマ三十三とまとめるか。理論に人の時間を割くか。決めるのは人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：条件つきで勧める', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '5 系統を経済学の典型的な設定で比べる\n1 つの入口で呼べるライブラリ', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '有力なチームが少なくとも 10 組\n比較も次の 1 本で埋まるおそれ', C.red);
        const qh = box(g, 960, 320, 540, 380, '', { stroke: C.orange });
        const qt = txt(g, 1230, 370, '人が決めること', { size: 30, weight: 700, fill: C.orange });
        const q1 = txt(g, 1000, 450, '比較と道具を成果と認めるか', { size: 28, anchor: 'start' });
        const q2 = txt(g, 1000, 530, 'T033 と1つにまとめるか', { size: 28, anchor: 'start' });
        const q3 = txt(g, 1000, 610, '理論に人の時間を割けるか', { size: 28, anchor: 'start' });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(qh, t, T[3]); show(qt, t, T[3] + 0.2);
          show(q1, t, T[3] + 0.5); show(q2, t, T[4]); show(q3, t, T[4] + 2.5);
        };
      }),
    ],
  });
})();
