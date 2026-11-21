// T069 ニューラルネットによる構造パラメータの推定：精度・速度・推論の検証 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T069.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T069', title: 'ニューラル推定量の検証', subtitle: '信頼区間は正しいか、どこで壊れるか',
    hook: '速さではなく、正しさを測ります。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '速さではなく、区間の正しさを問う', [
        'テーマは、ニューラルネットによる構造推定です。',
        'シミュレーションで学習したネットが、データからパラメータを直接返します。',
        '問いは三つ。まず、従来の推定法より正確か。',
        '次に、信頼区間は名目どおりに真の値を含むか。',
        'そして、どの条件で壊れるか。速さではなく、正しさを問います。',
      ], (g, T) => {
        const dv = box(g, 140, 220, 280, 120, 'データ', { size: 34, stroke: C.cyan });
        const nv = box(g, 600, 220, 340, 120, 'ニューラルネット\n合成データで学習', { size: 30, stroke: C.purple });
        const pv = box(g, 1120, 220, 340, 120, '構造パラメータ', { size: 34 });
        const a1 = arrow(g, 425, 280, 592, 280, { color: C.cyan, width: 5 });
        const a2 = arrow(g, 945, 280, 1112, 280, { color: C.ink, width: 5 });
        const q1 = card(g, 140, 420, 420, 150, '① 正確か', '同じ計算量の従来法と比べる', C.gray);
        const q2 = card(g, 590, 420, 420, 150, '② 区間は正しいか', '名目どおりに真の値を含むか', C.blue);
        const q3 = card(g, 1040, 420, 420, 150, '③ どこで壊れるか', '誤特定・範囲外・弱い識別', C.red);
        const focus = el('rect', { x: 575, y: 405, width: 900, height: 180, rx: 20, fill: 'none', stroke: C.blue, 'stroke-width': 5 }, g);
        const main = box(g, 140, 630, 1320, 90, '問い：速さではなく、推論の正しさ', { size: 32, stroke: C.blue, weight: 700 });
        return t => {
          show(dv, t, T[1]); drawLine(a1, prog(t, T[1] + 0.5, 0.8)); show(nv, t, T[1] + 0.9);
          drawLine(a2, prog(t, T[1] + 1.4, 0.8)); show(pv, t, T[1] + 1.8);
          show(q1, t, T[2]); show(q2, t, T[3]); show(q3, t, T[4]);
          [dv, nv, pv, a1, a2].forEach(n => dim(n, t, T[2], 0.4));
          dim(q1, t, T[4] + 1.2, 0.4);
          focus.setAttribute('opacity', prog(t, T[4] + 1.2, 0.5));
          show(main, t, T[4] + 1.2);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '点検されないまま、広がりやすい', [
        'なぜ今なのか。理由は三つです。',
        '事前学習版は、推定が数秒で終わり、共有できると主張します。',
        '配布物は、学習済みのネットとデータを渡すと推定値が返る関数です。',
        '中身を見ずに使える形なので、点検されないまま広がりやすいのです。',
        '一方、統計の側では、検証の道具と診断が揃いました。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 700, 150, '推定が数秒で終わる', 'Wei・Jiang（2025b）の主張（要旨）', C.cyan);
        const c2 = card(g, 120, 390, 700, 150, '中身を見ずに使える', '配布物は MATLAB の関数（pNNE）', C.red);
        const warn = txt(g, 470, 600, '点検されないまま広がりやすい', { size: 32, fill: C.red, weight: 700 });
        const tools = box(g, 960, 260, 500, 140, '道具\nsbi・BayesFlow', { size: 30, stroke: C.purple });
        const diag = box(g, 960, 440, 500, 140, '診断\nSBC・被覆率・TARP', { size: 30, stroke: C.purple });
        const lt = txt(g, 1210, 640, '検証の費用が下がった', { size: 30, fill: C.green, weight: 700 });
        return t => {
          show(c1, t, T[1]); show(c2, t, T[2]); show(warn, t, T[3]);
          dim(c1, t, T[4], 0.5); dim(c2, t, T[4], 0.5); dim(warn, t, T[4], 0.5);
          show(tools, t, T[4]); show(diag, t, T[4] + 0.5); show(lt, t, T[4] + 1.2);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '提案者は、被覆率を報告していない', [
        '提案者は、ウェイとジャンの二人。論文は二本です。',
        '検証したモデルは、自己回帰モデルと逐次探索モデルです。',
        '標準誤差は、ネットに出させるか、ブートストラップで出します。',
        'ただし被覆率は、読めた範囲では報告がありません。付録は未読です。',
        '機械学習の側では、ニューラル事後分布は過信しうると報告されています。',
      ], (g, T) => {
        const tb = table(g, 160, 190, 3, 4, 426, 86);
        const head = ['', 'Wei・Jiang（2025a）', '2025b 事前学習版'];
        const rows = [['検証したモデル', 'AR(1)・逐次探索', '逐次探索のみ'], ['標準誤差', 'ネットが分散を出力', 'ブートストラップ'], ['被覆率', '読めた範囲に無い', '報告なし']];
        const hd = grp(g); head.forEach((s, c) => txt(hd, tb.cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 28, weight: c === 0 ? 700 : 500, fill: i === 2 && c > 0 ? C.red : C.ink })); return n; });
        const hi = el('rect', { x: 160, y: 448, width: 1278, height: 86, rx: 6, fill: 'none', stroke: C.red, 'stroke-width': 5 }, g);
        const unread = txt(g, 800, 580, '2025a の付録 A.4「統計的な精度の推定」は未読', { size: 28, fill: C.yellow, weight: 700 });
        const ml = card(g, 160, 630, 1278, 110, '機械学習の側：ニューラル事後分布は過信しうる', '', C.cyan);
        const mlsrc = txt(g, 1410, 685, 'Hermans ほか（2022、要旨）', { size: 24, fill: C.mute, anchor: 'end' });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]);
          show(rg[0], t, T[1]); show(rg[1], t, T[2]); show(rg[2], t, T[3]);
          hi.setAttribute('opacity', prog(t, T[3] + 0.5, 0.4));
          show(unread, t, T[3] + 1.5);
          show(ml, t, T[4]); show(mlsrc, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '主な結果は、合成データだけで出せる', [
        '主な結果は、合成データだけで出せます。',
        '実データは、現実の標本の形での例示に使います。',
        'バスのエンジン交換と需要推定のデータは、無料で即日、公開です。',
        'ただし、元のデータ自体の利用条件は、まだ確かめていません。',
        '探索モデルの実データは、規約を確かめるまで秘匿扱いにします。',
      ], (g, T) => {
        const sim = box(g, 160, 190, 1280, 80, '主役は合成データ。実データは例示に使う', { size: 30, stroke: C.purple, weight: 700 });
        const tb = table(g, 160, 310, 3, 4, 426, 86);
        const head = ['モデルとデータ', '入手', '区分'];
        const rows = [['バスのエンジン交換', 'GitHub・無料・即日', 'T0 公開'], ['BLP 型の需要', 'pyblp 同梱・無料・即日', 'T0 公開'], ['逐次探索（Kaggle）', '規約は未確認', 'T2 扱い']];
        const hd = grp(g); head.forEach((s, c) => txt(hd, tb.cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 28, fill: i === 2 && c > 0 ? C.red : C.ink })); return n; });
        const note = txt(g, 800, 700, '元データ自体の利用条件は未確認', { size: 30, fill: C.yellow, weight: 700 });
        return t => {
          show(sim, t, T[0]);
          show(tb.g, t, T[1]); show(hd, t, T[1]);
          show(rg[0], t, T[2]); show(rg[1], t, T[2] + 0.6);
          show(note, t, T[3]);
          show(rg[2], t, T[4]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('手法の候補', 'モデルの梯子を、物差しつきで登る', [
        'このテーマは手法の検証なので、シミュレーションの実験を設計します。',
        '真の値を固定して標本を千回引き、区間の被覆率を数えます。',
        '千回なら、被覆率の誤差は約〇・七ポイント。二ポイントのずれは検出できます。',
        'モデルは、尤度が書ける易しいものから順に、梯子を登ります。',
        '段一から段四を先に終え、動学ゲームには手を出しません。',
      ], (g, T) => {
        const exp = card(g, 120, 200, 640, 150, '被覆率の実験', '真の値を固定し、標本を 1,000 回引く', C.purple);
        const mc = card(g, 120, 390, 640, 150, '誤差 約 0.7 ポイント', '2 ポイント以上のずれを検出（筆者の計算）', C.purple);
        const term = box(g, 120, 590, 640, 110, '被覆率 = 区間が真の値を\n含む割合（名目 95%）', { size: 28, stroke: C.mute, color: C.mute });
        const L = [['1', 'AR(1)・プロビット'], ['2', '混合ロジット・多項プロビット'], ['3', '逐次探索（提案者の主戦場）'], ['4', 'バスのエンジン交換'], ['5', 'BLP 型の需要'], ['6', '動学ゲーム：手を出さない']];
        const rungs = L.map(([k, s], i) => {
          const y = 640 - i * 84, col = i < 4 ? C.blue : i === 4 ? C.gray : C.red;
          const n = grp(g);
          el('rect', { x: 860, y, width: 620, height: 70, rx: 12, fill: C.panel, stroke: col, 'stroke-width': 3 }, n);
          txt(n, 900, y + 35, k, { size: 28, weight: 800, fill: col });
          txt(n, 940, y + 35, s, { size: 28, anchor: 'start' });
          n.__col = col; return n;
        });
        const bracket = grp(g);
        el('path', { d: 'M1500,710 H1520 V388 H1500', fill: 'none', stroke: C.blue, 'stroke-width': 4 }, bracket);
        txt(bracket, 1540, 549, '先に', { size: 26, fill: C.blue, weight: 700, anchor: 'start' });
        return t => {
          show(exp, t, T[0] + 0.5); show(term, t, T[1]); show(mc, t, T[2]);
          [exp, mc, term].forEach(n => dim(n, t, T[3], 0.35));
          rungs.forEach((n, i) => { show(n, t, T[3] + i * 0.35); dim(n, t, T[4], i < 4 ? 1 : 0.5); });
          show(bracket, t, T[4]);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '同じ問いは空き、周辺は埋まりつつある', [
        '同じ問いに答えた研究は、検索では見つかりませんでした。',
        '最大の脅威は提案者自身です。改訂が続き、検証を広げれば空白は縮みます。',
        'ヒューチとキーンの二〇二六年の論文は、多項プロビットの領域をほぼ取りました。',
        'クリールの二〇二一年の論文は被覆率を調べたとされますが、本文は未確認です。',
        '隣のテーマ六十八とは、バスのモデルの実装を共有できます。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 460, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 640), ln(1270, 640)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 460, r: 120, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 460, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 210, y - 60, 420, 120, s, { size: 28, stroke: col });
        const wj = node(330, 290, 'Wei・Jiang\n脅威 高：改訂が続く', C.red);
        const hk = node(1270, 290, 'Huch・Keane（2026）\n脅威 高：梯子の段2', C.red);
        const cr = node(330, 640, 'Creel（2021）\n被覆率：本文は未確認', C.yellow);
        const t68 = node(1270, 640, 'テーマ T068\n基準実装を共有', C.gray);
        return t => {
          show(me, t, T[0]);
          [T[1], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(wj, t, T[1]); show(hk, t, T[2]); show(cr, t, T[3]); show(t68, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '空白が埋まっていたら、1か月目で止める', [
        '最初の一か月は、先行研究の本文を確かめます。',
        '複数のモデルで被覆率を評価した論文が見つかれば、そこで撤退します。',
        '二か月目に提案者の結果を再現できなければ、先へは進みません。',
        'すべての段で被覆率が名目から二ポイント以内なら、短い報告に切り替えます。',
        '三か月目に、結果を見る前の論文を書き、人の承認でロックします。',
      ], (g, T) => {
        const M = ['本文\n確認', '段1\n再現', '段2・3\nロック', '段4\nバス', '段5\nライブラリ', '初稿\n監査'];
        const X = i => 170 + i * 220;
        const months = M.map((s, i) => {
          const n = grp(g);
          el('rect', { x: X(i), y: 200, width: 200, height: 130, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          txt(n, X(i) + 100, 225, `${i + 1} か月`, { size: 24, fill: C.mute });
          txt(n, X(i) + 100, 285, s, { size: 28, weight: 700 });
          return n;
        });
        const back = grp(g);
        const stop = (i, y, s, w = 920, col = C.red) => {
          const n = grp(g);
          n.__line = el('line', { x1: X(i) + 100, x2: X(i) + 100, y1: 335, y2: y - 40, stroke: col, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
          box(n, X(i) + 100 - 20, y - 40, w, 80, s, { size: 28, stroke: col });
          return n;
        };
        const s1 = stop(0, 440, '被覆率の横断評価が既にある → 撤退');
        const s2 = stop(1, 560, '提案者の結果を再現できない → 先へ進まない');
        const s3 = stop(2, 680, '全段で名目 ±2 ポイント以内 → 短い報告に', 820);
        const lk = lock(g, X(2) + 100, 150, 0.5);
        return t => {
          const cur = t < T[2] ? 0 : t < T[3] ? 1 : 2;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (t < T[0] || i === cur ? 1 : 0.4)); });
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[4] + 0.3); setLock(lk, prog(t, T[4] + 1, 0.8));
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「条件つきで勧める」', [
        'AIの下書きは、条件つきで勧める、です。',
        '勝ち筋は、尤度が書けるモデルを物差しに、被覆率を独立に測ることです。',
        '懸念は動きの速さです。半年の間に空白が埋まるおそれがあります。',
        '問題なしという結果でも出すか。テーマ六十八と同時に着手するか。',
        '結果が提案者に不利なら、先に知らせるか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：条件つきで勧める', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '尤度が書けるモデルを物差しに\n被覆率を独立に測る', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '2026年だけで近接論文が複数\n6か月で空白が埋まるおそれ', C.red);
        const q = box(g, 960, 320, 540, 300, '人が決めること\n\n「問題なし」でも出すか\nT068 と同時に着手するか\n不利な結果を先に知らせるか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
