// T021 二重機械学習の実務上の落とし穴の系統的な点検 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T021.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
  // 小さな四角を横に並べる（件数を見せる）。戻り値は四角の配列
  function squares(g, x, y, n, size, gap) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(el('rect', { x: x + i * (size + gap), y, width: size, height: size, rx: 8, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, g));
    return out;
  }
  const paint = (r, col, on) => { r.setAttribute('fill', on ? col : C.panel); r.setAttribute('stroke', on ? col : C.line); };

  VIDEO({
    id: 'T021', title: '二重機械学習の落とし穴', subtitle: '実装を変えると、結論は動くか',
    hook: '調べたら、同じ問いに先客がいました。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '実装を変えると、結論まで動くか', [
        'テーマは、二重機械学習の実務上の落とし穴です。',
        '二重機械学習は、機械学習で調整してから効果を測る方法です。',
        '学習器、データの分け方、乱数の種を変えると、推定値は動きます。',
        '結論の符号まで変わるのか。それが元の問いです。',
        'ただ、AIの下書きは、原案のままでは勧めない、です。',
      ], (g, T) => {
        const data = box(g, 120, 330, 240, 110, '同じデータ', { size: 32, stroke: C.cyan });
        const knob = box(g, 470, 300, 340, 170, '学習器\n分け方\n乱数の種', { size: 30, stroke: C.purple });
        const a1 = arrow(g, 365, 385, 462, 385, { color: C.cyan, width: 5 });
        const a2 = arrow(g, 815, 385, 905, 385, { color: C.purple, width: 5 });
        const term = box(g, 120, 520, 900, 80, '二重機械学習 = 機械学習で調整してから効果を測る', { size: 28, stroke: C.mute, color: C.mute });
        const ex = tag(g, '例（架空の模式図）');
        const zero = el('line', { x1: 1200, x2: 1200, y1: 250, y2: 520, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
        const zl = txt(g, 1200, 228, 'ゼロ', { size: 24, fill: C.mute });
        const c1 = coef(g, 1200, 310, 100, 1.6, 0.8, 2.4, C.blue);
        const c2 = coef(g, 1200, 385, 100, 0.2, -0.7, 1.1, C.gray);
        const c3 = coef(g, 1200, 460, 100, -1.5, -2.3, -0.7, C.red);
        const q = box(g, 120, 520, 1340, 80, '問い：実装しだいで、結論の符号まで変わるか', { size: 32, stroke: C.blue, weight: 700 });
        const verdict = box(g, 120, 640, 1340, 90, 'AI の下書き：原案のままでは勧めない', { size: 32, stroke: C.red, weight: 700 });
        return t => {
          show(data, t, T[0] + 0.3);
          show(term, t, T[1], T[3] - 0.3);
          drawLine(a1, prog(t, T[2], 0.8)); show(knob, t, T[2] + 0.4);
          drawLine(a2, prog(t, T[2] + 1, 0.8));
          show(ex, t, T[2] + 1.4); show(zero, t, T[2] + 1.4); show(zl, t, T[2] + 1.4);
          show(c1, t, T[2] + 1.8); show(c2, t, T[2] + 2.3); show(c3, t, T[2] + 2.8);
          show(q, t, T[3]);
          show(verdict, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', '使い方は粗く、指針はもう出始めた', [
        '二〇二三年三月までの応用三十六本を数えた研究があります。',
        'うち二十七本、七割五分は、学習器を一つしか使っていません。',
        '分割の反復を使ったのは、八本、二割二分だけでした。',
        'ところが二〇二四年から、点検と指針の論文が続けて出ました。',
        '今という時期は、既に過ぎつつあります。',
      ], (g, T) => {
        const tg = tag(g, 'Fuhr ほか（2024）');
        // 36本を 9×4 の格子で
        const cells = [];
        for (let i = 0; i < 36; i++) {
          const x = 140 + (i % 9) * 68, y = 230 + Math.floor(i / 9) * 68;
          cells.push(el('rect', { x, y, width: 56, height: 56, rx: 8, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, g));
        }
        const cg = grp(g); cells.forEach(c => cg.appendChild(c));
        const l1 = txt(g, 140, 540, '学習器が1つ：27本（75%）', { size: 30, fill: C.red, weight: 700, anchor: 'start' });
        const l2 = txt(g, 140, 600, '分割の反復あり：8本（22%）', { size: 30, fill: C.green, weight: 700, anchor: 'start' });
        const c = card(g, 900, 240, 600, 220, '点検と指針が続けて出た', 'Bach ほか、Fuhr ほか（2024）\nAhrens ほか、Siegmann（2025）', C.cyan);
        const late = box(g, 900, 520, 600, 100, '「今」は過ぎつつある', { size: 34, stroke: C.yellow, color: C.yellow, weight: 700 });
        return t => {
          show(tg, t, T[0]); show(cg, t, T[0] + 0.3);
          const p1 = prog(t, T[1], 1.2), p2 = prog(t, T[2], 1.0);
          cells.forEach((r, i) => {
            if (i >= 28 && p2 > 0 && i < 28 + Math.round(8 * p2)) paint(r, C.green, true);
            else paint(r, C.red, i < Math.round(27 * p1));
          });
          show(l1, t, T[1] + 0.6); show(l2, t, T[2] + 0.4);
          show(c, t, T[3]);
          dim(cg, t, T[3] + 0.5, 0.4); dim(l1, t, T[3] + 0.5, 0.4); dim(l2, t, T[3] + 0.5, 0.4);
          show(late, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '先客は、10件の実データで既に振った', [
        'いちばん近いのは、二〇二五年のシーグマンの修士論文です。',
        '再現データ十件で、学習器や乱数の種などを振りました。',
        '十件中九件で、設定しだいで解釈が二通り以上になりました。',
        '当てはまりの良い設定に絞っても、十件中三件が残りました。',
        '名目九割五分の区間の被覆率は、上限でも〇・四八でした。',
      ], (g, T) => {
        const tg = tag(g, 'Siegmann（2025）本文・表4.1と表4.2');
        const pap = paper(g, 130, 200, 0.9);
        const who = txt(g, 230, 250, 'MIT の修士論文。全文を読んだ', { size: 28, anchor: 'start' });
        const r1 = squares(g, 520, 340, 10, 60, 14), r2 = squares(g, 520, 450, 10, 60, 14);
        const g1 = grp(g); r1.forEach(r => g1.appendChild(r));
        const g2 = grp(g); r2.forEach(r => g2.appendChild(r));
        const l1 = txt(g, 490, 370, '制限なし：9件', { size: 30, anchor: 'end', weight: 700 });
        const l2 = txt(g, 490, 480, '絞っても：3件', { size: 30, anchor: 'end', weight: 700 });
        // 被覆率の棒
        const X = v => 520 + v * 800;
        const cov = grp(g);
        const bar = el('rect', { x: X(0), y: 600, width: X(0.48) - X(0), height: 44, rx: 8, fill: C.red }, cov);
        el('line', { x1: X(0.95), x2: X(0.95), y1: 580, y2: 664, stroke: C.green, 'stroke-width': 5, 'stroke-dasharray': '10 8' }, cov);
        txt(cov, X(0.95), 696, '名目 0.95', { size: 26, fill: C.green, weight: 700 });
        txt(cov, 490, 622, '被覆率の上限', { size: 30, anchor: 'end', weight: 700 });
        txt(cov, X(0.48) + 14, 622, '0.48', { size: 30, fill: C.red, weight: 700, anchor: 'start' });
        return t => {
          show(tg, t, T[0]); show(pap, t, T[0] + 0.3); show(who, t, T[0] + 0.6);
          show(g1, t, T[1]); show(g2, t, T[1] + 0.3);
          const p1 = prog(t, T[2], 1.2), p2 = prog(t, T[3], 1.0);
          r1.forEach((r, i) => paint(r, C.red, i < Math.round(9 * p1)));
          r2.forEach((r, i) => paint(r, C.red, i < Math.round(3 * p2)));
          show(l1, t, T[2] + 0.6); show(l2, t, T[3] + 0.5);
          show(cov, t, T[4]); bar.setAttribute('width', Math.max(0.1, (X(0.48) - X(0)) * prog(t, T[4] + 0.3, 1.2)));
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '再現データは、半分強が手に入らない', [
        '材料は、公刊論文の再現パッケージです。',
        '先客の場合、二十二の分析のうち、入手できたのは十件でした。',
        '入手率はおよそ四割五分です。公開分は、公開区分の見込みです。',
        'データが非公開で、コードだけが公開されている論文もあります。',
        '必要な変数が入っているかは、開けてみるまで分かりません。',
      ], (g, T) => {
        const pk = pkg(g, 210, 310, 0.9);
        const pl = txt(g, 210, 420, '再現パッケージ', { size: 28 });
        const cells = [];
        for (let i = 0; i < 22; i++) {
          const x = 420 + (i % 11) * 92, y = 230 + Math.floor(i / 11) * 92;
          cells.push(el('rect', { x, y, width: 76, height: 76, rx: 10, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, g));
        }
        const cg = grp(g); cells.forEach(c => cg.appendChild(c));
        const ok = txt(g, 420, 450, '入手できた：10件', { size: 30, fill: C.cyan, weight: 700, anchor: 'start' });
        const ng = txt(g, 900, 450, '入手できず：12件', { size: 30, fill: C.gray, weight: 700, anchor: 'start' });
        const rate = box(g, 420, 510, 1000, 90, '入手率 約45%　区分：公開分は T0 の見込み', { size: 30, stroke: C.cyan });
        const warn = card(g, 420, 630, 1000, 120, '未確認：二重機械学習に要る変数が入っているか', '', C.yellow);
        const code = box(g, 120, 510, 250, 90, 'コードだけ', { size: 28, stroke: C.gray, color: C.gray });
        return t => {
          show(pk, t, T[0]); show(pl, t, T[0] + 0.3); show(cg, t, T[0] + 0.6);
          const p = prog(t, T[1], 1.2);
          cells.forEach((r, i) => {
            if (i < 10) paint(r, C.cyan, i < Math.round(10 * p));
            else { r.setAttribute('fill', C.panel); r.setAttribute('stroke', p >= 1 ? C.gray : C.line); r.setAttribute('stroke-dasharray', p >= 1 ? '8 6' : 'none'); }
          });
          show(ok, t, T[1] + 0.8); show(ng, t, T[1] + 1.2);
          show(rate, t, T[2]);
          show(code, t, T[3]);
          show(warn, t, T[4]);
        };
      }),

      // 5 手法の候補 -----------------------------------------------------
      scene('手法の候補', '立て直すなら、処方が効くかを測る', [
        '立て直すなら、問いは処方が効くかどうかです。',
        '処方とは、スタッキングと分割の反復のことです。',
        '実データで、処方ごとに結論が動く割合を比べます。',
        '真の値が分かる半合成データで、被覆率も測ります。',
        'ただし、処方が効くという結果は、指針の追認になります。',
      ], (g, T) => {
        const qb = box(g, 120, 190, 760, 90, '問い：処方で、結論の揺れは減るか', { size: 32, stroke: C.blue, weight: 700 });
        const term = box(g, 120, 310, 760, 80, 'スタッキング = 複数の学習器を混ぜて使う', { size: 28, stroke: C.mute, color: C.mute });
        const ex = tag(g, '例（架空の模式図）');
        const ax = axes(g, 1000, 260, 460, 400, [0, 2], [0, 1], { ylabel: '結論が動く割合' });
        const bw = 140;
        const b1 = el('rect', { x: ax.X(0.5) - bw / 2, y: ax.Y(0.8), width: bw, height: ax.Y(0) - ax.Y(0.8), rx: 6, fill: C.gray }, g);
        const b2 = el('rect', { x: ax.X(1.5) - bw / 2, y: ax.Y(0.35), width: bw, height: ax.Y(0) - ax.Y(0.35), rx: 6, fill: C.blue }, g);
        const lb1 = txt(g, ax.X(0.5), 700, '単一の学習器', { size: 26, fill: C.gray });
        const lb2 = txt(g, ax.X(1.5), 700, '処方つき', { size: 26, fill: C.blue });
        const semi = card(g, 120, 415, 760, 175, '半合成データ', '共変量は実物、結果は生成する\n真の値が分かり、被覆率を測れる', C.purple);
        const note = box(g, 120, 620, 760, 90, '「効く」は Ahrens らの勧告の追認', { size: 30, stroke: C.yellow, color: C.yellow });
        return t => {
          show(qb, t, T[0]);
          show(term, t, T[1], T[3] - 0.3);
          show(ex, t, T[2]); show(ax.g, t, T[2]);
          const p1 = prog(t, T[2] + 0.4, 1), p2 = prog(t, T[2] + 1.2, 1);
          b1.setAttribute('height', Math.max(0.1, (ax.Y(0) - ax.Y(0.8)) * p1)); b1.setAttribute('y', ax.Y(0) - (ax.Y(0) - ax.Y(0.8)) * p1);
          b2.setAttribute('height', Math.max(0.1, (ax.Y(0) - ax.Y(0.35)) * p2)); b2.setAttribute('y', ax.Y(0) - (ax.Y(0) - ax.Y(0.35)) * p2);
          b1.setAttribute('opacity', p1 > 0 ? 1 : 0); b2.setAttribute('opacity', p2 > 0 ? 1 : 0);
          show(lb1, t, T[2] + 0.4); show(lb2, t, T[2] + 1.2);
          show(semi, t, T[3]);
          show(note, t, T[4]);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '同じ設計が、もう出ている', [
        '最大の脅威は、シーグマンの論文です。指導教員はアンドリュースです。',
        '同じ拡張を先にやられる公算が大きい、というのが筆者の見解です。',
        '実務指針は、手法の提案者たちの論文が、学術誌に採択済みです。',
        'DoubleMLの開発チームが、実データに進む可能性もあります。',
        'AIで再現パッケージを大量に回す流れ作業も、既に公開されています。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 470, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 290), ln(1270, 290), ln(330, 650), ln(1270, 650)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 470, r: 115, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 470, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col, h = 120) => box(g, x - 215, y - h / 2, 430, h, s, { size: 27, stroke: col });
        const si = node(330, 290, 'Siegmann（2025）\n同じ設計・脅威は最大', C.red);
        const op = txt(g, 330, 385, '続編の公算大（筆者の見解）', { size: 26, fill: C.yellow });
        const ah = node(1270, 290, 'Ahrens ほか（2025）\n実務指針・学術誌に採択', C.red);
        const ba = node(330, 650, 'Bach ほか（2024）\nDoubleML の開発チーム', C.gray);
        const xu = node(1270, 650, 'Xu と Yang（2026）\nAI で大量に再推定', C.gray);
        return t => {
          show(me, t, 0.3);
          [T[0], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(si, t, T[0]); show(op, t, T[1]); show(ah, t, T[2]); show(ba, t, T[3]); show(xu, t, T[4]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', '入手が25件に届かなければ止める', [
        '着手の前に、シーグマンの続編が出ていないかを確かめます。',
        '一か月目に、入手できる分析が二十五件に届かなければ止めます。',
        '二か月目は、先行の表の再現とロックです。十件中七件が目安です。',
        '三か月目に、指針の追認だけで新しい知見が無ければ止めます。',
        '既存のパッケージに同じ機能が入れば、その時点で止めます。',
      ], (g, T) => {
        const M = ['一覧\n入手可否', '再現\nロック', '全件\n再推定', '半合成', '道具', '草稿\n監査'];
        const X = i => 170 + i * 220;
        const months = M.map((s, i) => {
          const n = grp(g);
          el('rect', { x: X(i), y: 190, width: 200, height: 130, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 3 }, n);
          txt(n, X(i) + 100, 214, `${i + 1} か月`, { size: 24, fill: C.mute });
          txt(n, X(i) + 100, 275, s, { size: 28, weight: 700 });
          return n;
        });
        const back = grp(g);
        const stop = (i, y, s) => {
          const n = grp(g);
          n.__line = i == null ? null : el('line', { x1: X(i) + 100, x2: X(i) + 100, y1: 325, y2: y - 35, stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, back);
          box(n, (i == null ? X(0) : Math.min(X(i) + 80, 530)), y - 35, 960, 70, s, { size: 27, stroke: C.red });
          return n;
        };
        const s0 = stop(null, 395, '着手前：続編がスタッキング等を扱っていた → やめる');
        const s1 = stop(0, 485, '入手できる分析が 25 件未満 → 止める');
        const s2 = stop(1, 575, '10 件中 7 件以上で再現できない → 止める');
        const s3 = stop(2, 665, '指針の追認だけで、新しい知見が無い → 止める');
        const s4 = box(g, X(3) + 40, 720, 640, 60, '随時：パッケージに同じ機能 → 止める', { size: 26, stroke: C.red });
        const lk = lock(g, X(1) + 100, 140, 0.45);
        return t => {
          const cur = t < T[2] ? 0 : t < T[3] ? 1 : 2;
          months.forEach((n, i) => { const p = show(n, t, 0.3 + i * 0.25); n.setAttribute('opacity', p * (t < T[1] || i === cur ? 1 : 0.4)); });
          show(s0, t, T[0]);
          [[s1, T[1]], [s2, T[2]], [s3, T[3]]].forEach(([n, a]) => n.__line.setAttribute('opacity', show(n, t, a)));
          show(lk, t, T[2] + 0.3); setLock(lk, prog(t, T[2] + 1, 0.8));
          show(s4, t, T[4]);
        };
      }),

      // 8 判断の材料 -----------------------------------------------------
      scene('判断の材料', 'AI の下書きは「原案では勧めない」', [
        'AIの下書きは、原案のままでは勧めない、です。',
        '勝ち筋は、件数を数十に増やし、処方の効果を測って道具にすることです。',
        '懸念は、同じ拡張を、先客の側に先にやられることです。',
        '原案を落とすか、立て直すか。続編の危険をどこまで受け入れるか。',
        '論文より道具を主な成果にするか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：原案のままでは勧めない', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', '件数を 10 から数十に増やす\n処方の効果を測り、点検の道具にする', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '指導教員は Isaiah Andrews\n同じ拡張を先にやられる公算（筆者の見解）', C.red);
        const qh = box(g, 960, 320, 540, 380, '', { stroke: C.orange });
        const qt = txt(g, 1230, 370, '人が決めること', { size: 30, weight: 700, fill: C.orange });
        const q1 = txt(g, 1000, 450, '原案を落とすか、立て直すか', { size: 28, anchor: 'start' });
        const q2 = txt(g, 1000, 530, '続編の危険をどこまで許すか', { size: 28, anchor: 'start' });
        const q3 = txt(g, 1000, 610, '道具を主な成果にするか', { size: 28, anchor: 'start' });
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
