// L01 ラボの進め方 — 内容の正本はリポジトリ直下の README.md。
// 実在の研究結果は出さない。図の数値はすべて「例」と明記した架空の模式図。
(() => {
  const NAMES = ['テーマ\n100 → 10', 'ディープダイブ', '仮説\n100 → 10', '結果を見る前に\n論文を書く',
    '文献を\nデータにする', 'シミュレーター', '推定し、全仕様を\n記録する', '監査して\n公開する'];

  // 番号つきの段階の札
  function tile(g, x, y, w, h, num, label, o = {}) {
    const n = grp(g);
    el('rect', { x, y, width: w, height: h, rx: 16, fill: C.panel, stroke: o.stroke || C.line, 'stroke-width': 3 }, n);
    if (label) {
      el('circle', { cx: x + 30, cy: y + 30, r: 19, fill: C.blue }, n);
      txt(n, x + 30, y + 31, num, { size: 24, weight: 800, fill: C.bg });
      txt(n, x + w / 2 + 12, y + h / 2 + 6, label, { size: 28, weight: 600 });
    } else {
      txt(n, x + w / 2, y + h / 2, num, { size: 48, weight: 800 });
    }
    return n;
  }

  VIDEO({
    id: 'L01', title: 'AI ネイティブ経済学ラボの進め方', subtitle: 'AI が大量に作り、人が選ぶ',
    hook: 'AIが大量に作り、人が選ぶ研究室です。',
    scenes: [
      // 1 ---------------------------------------------------------------
      scene('ひと目でつかむ', 'AI が大量に読み、人が選ぶ', [
        'このラボの進め方を、四分ほどで説明します。',
        'まず、AIに大量の論文を読ませます。',
        'AIは、研究テーマと仮説をたくさん出します。',
        'その中から選ぶのは、人です。',
        '人が楽に選べるよう、見せ方を軽くします。',
      ], (g, T) => {
        const papers = grp(g);
        for (let i = 0; i < 5; i++) paper(papers, 120 + i * 26, 300 + i * 22, 1.3);
        const lp = txt(g, 226, 590, '大量の論文', { size: 30, fill: C.cyan });
        const a1 = arrow(g, 375, 430, 495, 430, { color: C.mute });
        const ai = computer(g, 630, 430, 1.3);
        const a2 = arrow(g, 770, 430, 880, 430, { color: C.mute });
        const dots = [], cloud = grp(g);
        for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) dots.push(el('circle', { cx: 910 + c * 30, cy: 295 + r * 30, r: 9, fill: C.purple }, cloud));
        const pick = el('circle', { cx: 910 + 6 * 30, cy: 295 + 3 * 30, r: 9, fill: C.green, stroke: C.ink, 'stroke-width': 3 }, g);
        const lt = txt(g, 1045, 620, 'テーマと仮説', { size: 30, fill: C.purple });
        const a3 = arrow(g, 1215, 430, 1320, 430, { color: C.mute });
        const hu = person(g, 1430, 440, 1.3);
        const lh = txt(g, 1430, 590, '人が選ぶ', { size: 30, fill: C.orange });
        const card = box(g, 480, 668, 640, 76, '見せ方を軽く：表・図・動画', { size: 30, stroke: C.blue });
        return t => {
          show(papers, t, T[1]); show(lp, t, T[1] + 0.3);
          drawLine(a1, prog(t, T[1] + 1.2, 0.8)); show(ai, t, T[1] + 1.6);
          drawLine(a2, prog(t, T[2], 0.8));
          dots.forEach((d, i) => d.setAttribute('opacity', prog(t, T[2] + 0.5 + i * 0.015, 0.3) * lerp(1, 0.3, prog(t, T[3] + 0.8, 0.8))));
          show(lt, t, T[2] + 1);
          drawLine(a3, prog(t, T[3], 0.8)); show(hu, t, T[3] + 0.3); show(lh, t, T[3] + 0.6);
          pick.setAttribute('opacity', prog(t, T[3] + 0.8, 0.5));
          pick.setAttribute('r', lerp(9, 17, prog(t, T[3] + 0.8, 0.8)));
          show(card, t, T[4]);
        };
      }),

      // 2 ---------------------------------------------------------------
      scene('3行でいうと', 'やり方は、3行で言える', [
        'やり方は、三行で言えます。',
        '一つめ。問いをたくさん作り、速く捨てます。',
        'テーマは百から十、そして一つに絞ります。',
        '二つめ。結果を見る前に、論文を書きます。',
        '三つめ。走らせた推定は、すべて残します。',
      ], (g, T) => {
        const row = (i, s, col) => {
          const n = grp(g), y = 190 + i * 185;
          el('rect', { x: 200, y, width: 1200, height: 150, rx: 18, fill: C.panel, stroke: col, 'stroke-width': 3 }, n);
          el('circle', { cx: 285, cy: y + 75, r: 36, fill: col }, n);
          txt(n, 285, y + 76, i + 1, { size: 40, weight: 800, fill: C.bg });
          txt(n, 360, y + (i ? 75 : 52), s, { size: 40, weight: 700, anchor: 'start' });
          return n;
        };
        const r1 = row(0, '大量に作って、速く捨てる', C.purple);
        const sub = txt(g, 360, 190 + 108, 'テーマ 100 → 10 → 1　　仮説 100 → 10', { size: 28, fill: C.mute, anchor: 'start' });
        const r2 = row(1, '結果を見る前に、論文を書く', C.orange);
        const r3 = row(2, '走らせた推定を、すべて残す', C.green);
        return t => { show(r1, t, T[1]); show(sub, t, T[2]); show(r2, t, T[3]); show(r3, t, T[4]); };
      }),

      // 3 ---------------------------------------------------------------
      scene('8つの段階', '8つの段階を、上から順に進む', [
        '研究は、八つの段階で進みます。',
        'テーマを絞り、深く調べ、仮説を選びます。',
        '四つめで、結果を見る前に論文を書きます。',
        '次に文献をデータにし、シミュレーターを作ります。',
        'シミュレーターは、合成データで推定量を試す道具です。',
        '七つめで推定し、すべての仕様を記録します。',
        '五から七は、毎日回します。',
        '最後に、監査してから公開します。',
      ], (g, T) => {
        const pos = i => [100 + (i % 4) * 360, i < 4 ? 200 : 450];
        const tiles = NAMES.map((s, i) => tile(g, pos(i)[0], pos(i)[1], 320, 140, i + 1, s));
        const link = i => { const [x, y] = pos(i); return arrow(g, x + 324, y + 70, x + 356, y + 70, { color: C.mute, width: 3 }); };
        const l = [0, 1, 2, 4, 5, 6].map(link);                       // 1→2, 2→3, 3→4, 5→6, 6→7, 7→8
        const down = arrow(g, 0, 0, 0, 0, { d: 'M1340,344 V395 H260 V446', color: C.mute, width: 3 });
        const loop = arrow(g, 0, 0, 0, 0, { d: 'M980,594 V660 H260 V598', color: C.purple, width: 5 });
        const ll = txt(g, 620, 700, '5 → 6 → 7 は毎日回す', { size: 30, fill: C.purple, weight: 700 });
        const hi = el('rect', { x: 460, y: 450, width: 320, height: 140, rx: 16, fill: 'none', stroke: C.purple, 'stroke-width': 6 }, g);
        const at = [T[1], T[1] + 0.9, T[1] + 1.8, T[2], T[3], T[3] + 1.6, T[5], T[7]];
        return t => {
          tiles.forEach((n, i) => show(n, t, at[i]));
          tiles.slice(0, 4).forEach(n => dim(n, t, T[3] - 0.2, 0.4));
          [1, 2, 3].forEach((k, j) => { drawLine(l[j], prog(t, at[k] - 0.3, 0.4)); if (t >= T[3] - 0.2) l[j].setAttribute('opacity', lerp(1, 0.4, prog(t, T[3] - 0.2, 0.5))); });
          drawLine(down, prog(t, T[3] - 0.4, 0.8));
          drawLine(l[3], prog(t, at[5] - 0.3, 0.4)); drawLine(l[4], prog(t, at[6] - 0.3, 0.4)); drawLine(l[5], prog(t, at[7] - 0.3, 0.4));
          hi.setAttribute('opacity', Math.min(prog(t, T[4], 0.4), 1 - prog(t, T[5] - 0.3, 0.4)));
          drawLine(loop, prog(t, T[6], 1.2)); show(ll, t, T[6] + 0.6);
        };
      }),

      // 4 ---------------------------------------------------------------
      scene('人が判断する5か所', '人が判断する関門は、5か所', [
        'AIが下書きし、人が確かめます。',
        '人が判断する関門は、五か所あります。',
        'テーマ選び、深掘り、仮説選びの三つ。',
        '論文を書いて、推定に進むとき。',
        'そして、公開するとき。',
        '関門では、人が決めて、理由を書き残します。',
      ], (g, T) => {
        const X = i => 110 + i * 175;
        const tiles = NAMES.map((_, i) => tile(g, X(i), 400, 150, 110, i + 1));
        const lg = grp(g); gate(lg, 560, 262, 24); txt(lg, 600, 263, '＝ 人が判断する関門', { size: 32, anchor: 'start', fill: C.orange });
        const gates = [0, 1, 2, 3, 7].map(i => {
          const n = grp(g);
          gate(n, X(i) + 75, 350, 28);
          el('rect', { x: X(i), y: 400, width: 150, height: 110, rx: 16, fill: 'none', stroke: C.orange, 'stroke-width': 6 }, n);
          return n;
        });
        const gt = [T[2], T[2] + 0.9, T[2] + 1.8, T[3], T[4]];
        const card = grp(g);
        el('rect', { x: 300, y: 590, width: 1000, height: 110, rx: 18, fill: C.panel, stroke: C.orange, 'stroke-width': 3 }, card);
        computer(card, 380, 648, 0.42, '');
        person(card, 1220, 648, 0.42);
        txt(card, 800, 645, 'AI が下書き  →  人が決めて、理由を書く', { size: 34, weight: 700 });
        return t => {
          tiles.forEach((n, i) => show(n, t, 0.3 + i * 0.08));
          show(lg, t, T[1]);
          gates.forEach((n, k) => show(n, t, gt[k]));
          [4, 5, 6].forEach(i => dim(tiles[i], t, T[4] + 0.8, 0.45));
          show(card, t, T[5]);
        };
      }),

      // 5 ---------------------------------------------------------------
      scene('3つのトラック', '研究の型は、3つのトラック', [
        '研究の型は、三つのトラックに分けます。',
        '一つめは因果推論。政策などの効果を測ります。',
        '二つめは構造推定。経済モデルの中身を推定します。',
        '三つめは、推定量や計量手法そのものの研究です。',
        '三つめの成果は、ライブラリにもなります。',
      ], (g, T) => {
        const CX = [290, 800, 1310], TT = ['因果推論', '構造推定', '推定量・計量手法'];
        const cols = CX.map((cx, i) => {
          const n = grp(g);
          el('rect', { x: cx - 220, y: 190, width: 440, height: 470, rx: 18, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          txt(n, cx, 605, TT[i], { size: 36, weight: 800 });
          return n;
        });
        // 因果推論: 処置群（青）が、ある時点から対照群（灰）と離れる
        const ax = axes(cols[0], 140, 250, 300, 260, [0, 10], [0, 8]);
        el('line', { x1: ax.X(5), x2: ax.X(5), y1: 250, y2: 510, stroke: C.mute, 'stroke-width': 2, 'stroke-dasharray': '8 8' }, cols[0]);
        const ctl = fitline(cols[0], ax, 0, 1.5, 10, 3.5, C.gray);
        const tr1 = fitline(cols[0], ax, 0, 3, 5, 4, C.blue);
        const tr2 = fitline(cols[0], ax, 5, 5.4, 10, 6.4, C.blue);
        // 構造推定: モデルの箱と、推定されるパラメータ（つまみ）
        box(cols[1], 660, 250, 280, 90, '経済モデル', { size: 30, stroke: C.purple });
        const knobs = [0, 1, 2].map(k => {
          el('line', { x1: 660, x2: 940, y1: 400 + k * 55, y2: 400 + k * 55, stroke: C.mute, 'stroke-width': 4 }, cols[1]);
          return el('circle', { cx: 660, cy: 400 + k * 55, r: 14, fill: C.purple, stroke: C.bg, 'stroke-width': 3 }, cols[1]);
        });
        const target = [860, 730, 800];
        // 推定量: 信頼区間が狭くなる
        const cf = [[0.9, 0.2, 1.6], [0.9, 0.5, 1.3], [0.9, 0.72, 1.08]].map(([e, lo, hi], k) =>
          coef(cols[2], 1150, 280 + k * 62, 180, e, lo, hi, k === 2 ? C.green : C.mute));
        const pk = pkg(g, 1310, 500, 0.6);
        const pl = txt(g, 1310, 712, 'ライブラリにもなる', { size: 30, fill: C.purple, weight: 700 });
        return t => {
          cols.forEach((n, i) => show(n, t, T[i + 1]));
          drawLine(ctl, prog(t, T[1] + 0.6, 1.2)); drawLine(tr1, prog(t, T[1] + 0.6, 0.6)); drawLine(tr2, prog(t, T[1] + 1.4, 0.6));
          knobs.forEach((k, i) => k.setAttribute('cx', lerp(660, target[i], prog(t, T[2] + 0.8 + i * 0.4, 1))));
          cf.forEach((n, k) => n.setAttribute('opacity', prog(t, T[3] + 0.6 + k * 0.6, 0.4)));
          show(pk, t, T[4]); show(pl, t, T[4] + 0.4);
        };
      }),

      // 6 ---------------------------------------------------------------
      scene('結果を見る前に書く', '結果を見る前に、決めて書く', [
        'なぜ、結果を見る前に書くのでしょうか。',
        '同じデータに、仕様は何通りでも当てられます。',
        '見てから選ぶと、偶然の当たりを拾ってしまいます。',
        'そこで、仮説と推定式を先に書きます。',
        '標本の定義と、成功と棄却の基準も先に決めます。',
        'この間、実データの結果変数は見ません。',
      ], (g, T) => {
        // 前半: 同じ点に何本も線を当てる（架空の模式図）
        const A = grp(g), ax = axes(A, 500, 220, 600, 420, [0, 10], [0, 10]), R = rng(7), pts = [];
        for (let i = 0; i < 26; i++) pts.push([0.6 + R() * 8.8, 2.5 + R() * 5]);
        scatter(A, ax, pts, C.cyan, 8);
        const fits = [[4.6, 5.2], [5.6, 4.4], [4.2, 5.9], [5.2, 4.9], [3.4, 7.2]].map(([a, b]) => fitline(A, ax, 0.3, a, 9.7, b, C.yellow, 4));
        const hit = fitline(A, ax, 0.3, 3.4, 9.7, 7.2, C.red, 7);
        const hl = txt(A, 1250, 300, '偶然の\n当たり？', { size: 32, fill: C.red, weight: 700 });
        // 後半: 先に書く4つと、見ない列
        const B = grp(g);
        el('rect', { x: 130, y: 180, width: 620, height: 540, rx: 18, fill: C.panel, stroke: C.cyan, 'stroke-width': 3 }, B);
        const items = ['仮説', '推定式', '標本の定義', '成功基準と棄却条件'].map((s, i) => {
          const n = grp(g); tick(n, 205, 262 + i * 122, 1.3); txt(n, 255, 262 + i * 122, s, { size: 38, weight: 700, anchor: 'start' }); return n;
        });
        const D = grp(g), tb = table(D, 880, 250, 4, 6, 150, 70);
        for (let r = 1; r < 6; r++) for (let c = 0; c < 4; c++) el('rect', { x: tb.cx(c) - 36, y: tb.cy(r) - 4, width: 72, height: 8, rx: 4, fill: C.mute, opacity: 0.6 }, D);
        const cover = grp(g);
        el('rect', { x: 1330, y: 250, width: 150, height: 420, fill: C.bg, opacity: 0.94, stroke: C.red, 'stroke-width': 5 }, cover);
        txt(cover, 1405, 460, '結果変数は\n見ない', { size: 28, fill: C.red, weight: 800 });
        const it = [T[3], T[3] + 1.4, T[4], T[4] + 1.6];
        return t => {
          show(A, t, T[1] - 0.6, T[3] - 0.5);
          fits.forEach((f, i) => drawLine(f, prog(t, T[1] + 0.4 + i * 0.45, 0.5)));
          drawLine(hit, prog(t, T[2] + 0.4, 0.6)); hl.setAttribute('opacity', prog(t, T[2] + 0.8, 0.4));
          show(B, t, T[3] - 0.2);
          items.forEach((n, i) => show(n, t, it[i]));
          show(D, t, T[5] - 0.2); show(cover, t, T[5] + 0.9);
        };
      }),

      // 7 ---------------------------------------------------------------
      scene('ロック', '書いたら、ロックする', [
        '書き終えたら、日付とハッシュを記録します。',
        'これを、ロックと呼びます。',
        'ハッシュは、文書の指紋のようなものです。',
        'ロックの後で、はじめて実データを推定します。',
        '後から仕様を変えたら、理由つきで履歴に残ります。',
      ], (g, T) => {
        const doc = paper(g, 150, 250, 2.4);
        const lk = lock(g, 352, 500, 1.3);
        const card = grp(g);
        el('rect', { x: 440, y: 290, width: 300, height: 170, rx: 16, fill: C.panel, stroke: C.orange, 'stroke-width': 3 }, card);
        txt(card, 590, 335, '日付 + ハッシュ', { size: 32, weight: 700 });
        const ex = txt(g, 590, 405, '例：2026-11-14\n3f9a…c21e', { size: 24, fill: C.mute });
        const line = el('path', { d: 'M820,420 H1480', stroke: C.mute, 'stroke-width': 5, fill: 'none' }, g);
        const mark = grp(g);
        el('line', { x1: 1120, x2: 1120, y1: 300, y2: 540, stroke: C.orange, 'stroke-width': 6 }, mark);
        txt(mark, 1120, 265, 'ロック', { size: 34, fill: C.orange, weight: 800 });
        const before = txt(g, 965, 350, 'ロック前\n結果変数を見ない', { size: 28, fill: C.mute });
        const after = txt(g, 1305, 350, 'ロック後\n実データを推定', { size: 28, fill: C.green, weight: 700 });
        const chg = grp(g);
        el('circle', { cx: 1360, cy: 420, r: 13, fill: C.yellow, stroke: C.bg, 'stroke-width': 3 }, chg);
        el('line', { x1: 1360, x2: 1360, y1: 436, y2: 510, stroke: C.yellow, 'stroke-width': 4 }, chg);
        el('rect', { x: 1180, y: 510, width: 320, height: 120, rx: 16, fill: C.panel, stroke: C.yellow, 'stroke-width': 3 }, chg);
        txt(chg, 1340, 570, '変更は理由つきで\n履歴に残る', { size: 28, weight: 700 });
        return t => {
          show(doc, t, 0.3); show(card, t, T[0] + 0.6);
          lk.setAttribute('opacity', prog(t, T[0] + 1.4, 0.4)); setLock(lk, prog(t, T[1], 0.7));
          drawLine(line, prog(t, T[1] + 0.3, 1)); show(mark, t, T[1] + 0.8);
          show(ex, t, T[2]);
          show(before, t, T[3]); show(after, t, T[3] + 1.2);
          show(chg, t, T[4]);
        };
      }),

      // 8 ---------------------------------------------------------------
      scene('仕様の記録', '走らせた推定は、すべて残す', [
        '推定は、一本ずつ記録に残ります。',
        '有意でなかった結果も、消しません。',
        '何本試したかが、あとで分かります。',
        'ロックした仕様の結果は、確証と呼びます。',
        'データを見た後の分析は、探索と書き分けます。',
        '探索で見つけたことは、次の仮説になります。',
      ], (g, T) => {
        txt(g, 130, 205, 'specs.csv', { size: 30, anchor: 'start', fill: C.cyan, weight: 700 });
        const tb = table(g, 130, 240, 3, 7, 180, 62);
        const EX = [[0.30, 0.10, 0.50], [0.26, 0.04, 0.48], [0.05, -0.20, 0.30], [0.42, 0.20, 0.64], [-0.08, -0.33, 0.17], [0.12, -0.10, 0.34]];
        const col = k => (k < 2 ? C.green : C.yellow);
        el('line', { x1: 1100, x2: 1100, y1: 245, y2: 650, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
        txt(g, 1100, 672, '0', { size: 24, fill: C.mute });
        txt(g, 1480, 205, '例（架空の模式図）', { size: 24, fill: C.mute, anchor: 'end' });
        const rows = EX.map(([e, lo, hi], k) => {
          const r = k + 1, n = grp(g);
          txt(n, tb.cx(0), tb.cy(r), 'S000' + r, { size: 24, fill: C.ink });
          el('rect', { x: tb.cx(1) - 50, y: tb.cy(r) - 5, width: 100, height: 10, rx: 5, fill: C.mute, opacity: 0.6 }, n);
          el('circle', { cx: tb.cx(2), cy: tb.cy(r), r: 13, fill: C.mute }, n);
          coef(n, 1100, 280 + k * 62, 420, e, lo, hi, C.mute);
          const c = grp(g);
          el('circle', { cx: tb.cx(2), cy: tb.cy(r), r: 13, fill: col(k) }, c);
          coef(c, 1100, 280 + k * 62, 420, e, lo, hi, col(k));
          return { n, c };
        });
        const cnt = txt(g, 400, 715, '試した数：6 本（例）', { size: 30, weight: 700 });
        const lg1 = grp(g); el('circle', { cx: 800, cy: 715, r: 13, fill: C.green }, lg1); txt(lg1, 825, 716, '確証（ロックした仕様）', { size: 28, anchor: 'start' });
        const lg2 = grp(g); el('circle', { cx: 1165, cy: 715, r: 13, fill: C.yellow }, lg2); txt(lg2, 1190, 716, '探索（データを見た後）', { size: 28, anchor: 'start' });
        return t => {
          rows.forEach(({ n, c }, k) => { show(n, t, T[0] + 0.5 + k * 0.8); c.setAttribute('opacity', prog(t, k < 2 ? T[3] : T[4], 0.6)); });
          show(cnt, t, T[2]); show(lg1, t, T[3]); show(lg2, t, T[4]);
        };
      }),

      // 9 ---------------------------------------------------------------
      scene('成果', '成果は、論文か、使える道具', [
        '公開の前に、別のAIが査読者として監査します。',
        '目指す成果は、学会発表と査読論文です。',
        'もう一つは、他の研究者が使えるライブラリです。',
        'どちらも、再現できる形で公開します。',
      ], (g, T) => {
        const doc = paper(g, 250, 260, 1.6);
        const ln = lens(g, 400, 400, 1.2);
        const la = txt(g, 330, 530, '査読者役の AI が監査', { size: 30, fill: C.purple, weight: 700 });
        const a1 = arrow(g, 540, 340, 730, 300, { color: C.mute });
        const a2 = arrow(g, 540, 400, 730, 540, { color: C.mute });
        const c1 = grp(g);
        el('rect', { x: 740, y: 200, width: 700, height: 200, rx: 18, fill: C.panel, stroke: C.green, 'stroke-width': 3 }, c1);
        paper(c1, 800, 245, 1, C.green);
        txt(c1, 1150, 300, '学会発表・査読論文', { size: 40, weight: 800 });
        const c2 = grp(g);
        el('rect', { x: 740, y: 440, width: 700, height: 200, rx: 18, fill: C.panel, stroke: C.purple, 'stroke-width': 3 }, c2);
        pkg(c2, 842, 540, 0.8);
        txt(c2, 1150, 515, 'ライブラリ', { size: 40, weight: 800 });
        txt(c2, 1150, 575, '他の研究者が使える道具', { size: 28, fill: C.mute });
        const strip = box(g, 500, 682, 600, 74, '再現できる形で公開する', { size: 32, stroke: C.blue, weight: 700 });
        return t => {
          show(doc, t, 0.3); show(ln, t, T[0]); show(la, t, T[0] + 0.5);
          drawLine(a1, prog(t, T[1], 0.7)); show(c1, t, T[1] + 0.4);
          drawLine(a2, prog(t, T[2], 0.7)); show(c2, t, T[2] + 0.4);
          show(strip, t, T[3]);
        };
      }),

      // 10 --------------------------------------------------------------
      scene('まとめ', 'まとめ', [
        'まとめます。',
        'AIが大量に作り、人が五つの関門で選びます。',
        '結果を見る前に書き、ロックします。',
        '走らせた推定は、すべて残します。',
        '詳しい手順は、READMEに書いてあります。',
      ], (g, T) => {
        const S = ['AI が大量に作り、人が 5 つの関門で選ぶ', '結果を見る前に書き、ロックする', '走らせた推定は、すべて残す'];
        const rows = S.map((s, i) => {
          const n = grp(g); tick(n, 250, 270 + i * 150, 1.6); txt(n, 320, 270 + i * 150, s, { size: 44, weight: 700, anchor: 'start' }); return n;
        });
        const foot = txt(g, 800, 705, '詳しい手順：リポジトリ直下の README.md', { size: 30, fill: C.mute });
        return t => { rows.forEach((n, i) => show(n, t, T[i + 1])); show(foot, t, T[4]); };
      }),
    ],
  });
})();
