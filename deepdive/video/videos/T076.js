// T076 公共調達の入札データによる入札モデルの構造推定 — ディープダイブ動画（構成の型②）。
// 内容の正本は deepdive/T076.md。数値はすべて正本にあるもの。模式図は画面に「例（架空の模式図）」と出す。
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
    id: 'T076', title: '公共調達入札の構造推定', subtitle: 'くじ引き入札で、費用と落札者はどう変わるか',
    hook: 'データは PDF の中に。問いは、くじ引きに。',
    scenes: [
      // 1 ひと目でつかむ ------------------------------------------------
      scene('ひと目でつかむ', '問いを、最低制限価格とくじ引きに絞る', [
        'テーマは、公共調達の入札データによる構造推定です。',
        '元の問いは、入札額から企業の費用の分布を逆算することでした。',
        'ところが、入札が最低制限価格に張り付くことがあります。',
        '同じ額が並ぶと、落札者はくじで決まります。',
        'このとき調達費用と落札者の選ばれ方はどう変わるか。それが問いです。',
      ], (g, T) => {
        const ex = tag(g, '例（架空の模式図）');
        const base = 620, floor = 460;
        const ax = grp(g);
        el('line', { x1: 140, x2: 900, y1: base, y2: base, stroke: C.mute, 'stroke-width': 3 }, ax);
        txt(ax, 520, base + 40, '5社の入札額', { size: 26, fill: C.mute });
        const tops = [300, 410, 260, 360, 330], stick = [false, true, false, true, true];
        const bars = tops.map((y0, i) => {
          const r = el('rect', { x: 190 + i * 140, y: y0, width: 90, height: base - y0, rx: 6, fill: C.blue }, g);
          return { r, y0, i };
        });
        const fl = grp(g);
        el('line', { x1: 150, x2: 900, y1: floor, y2: floor, stroke: C.red, 'stroke-width': 4, 'stroke-dasharray': '12 8' }, fl);
        txt(fl, 1220, floor, '最低制限価格 = 入札額の下限', { size: 28, fill: C.red, weight: 700 });
        const lot = box(g, 1000, 300, 440, 90, '同額が並ぶ → くじ', { size: 32, stroke: C.blue, weight: 700 });
        const q = box(g, 140, 700, 1320, 76, '問い：張り付きとくじで、調達費用と落札者はどう変わるか', { size: 30, stroke: C.blue, weight: 700 });
        return t => {
          show(ex, t, T[1]); show(ax, t, T[1]);
          const pb = prog(t, T[2] + 0.6, 1.2);
          bars.forEach(({ r, y0, i }) => {
            const p = prog(t, T[1] + 0.3 + i * 0.2, 0.5);
            const y = stick[i] ? lerp(y0, floor, pb) : y0;
            r.setAttribute('y', lerp(base, y, p)); r.setAttribute('height', Math.max(0.1, (base - y) * p));
            r.setAttribute('fill', stick[i] && pb > 0.5 ? C.red : C.blue);
          });
          show(fl, t, T[2]); show(lot, t, T[3]); show(q, t, T[4]);
        };
      }),

      // 2 なぜ今か -------------------------------------------------------
      scene('なぜ今か', 'くじは実務の問題になり、調書は読める', [
        'なぜ今なのか。理由は三つです。',
        'くじ引きが多いことは、実務で問題になっています。',
        '国土交通省が実態を調べると報じられました。ただし記事の本文は未確認です。',
        '入札調書は、文字入りのPDFで公開され、AIで表に直せます。',
        '一方で、有力なチームの研究は制度設計へ進み、空きは狭まっています。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 900, 150, 'くじ引きの多さが実務の問題に', '国土交通省が実態を調べる、との報道', C.red);
        const un = txt(g, 1060, 275, '記事の本文は未確認', { size: 28, fill: C.yellow, weight: 700, anchor: 'start' });
        const c2 = card(g, 120, 390, 900, 150, '入札調書は文字入りの PDF', '表に直す作業は AI が得意', C.cyan);
        const c3 = card(g, 120, 580, 900, 150, '空きは狭まる方向', '川合・中林らの計画は、検出から制度設計へ', C.red);
        return t => {
          show(c1, t, T[1]); show(un, t, T[2]); show(c2, t, T[3]); show(c3, t, T[4]);
        };
      }),

      // 3 文献の地図 -----------------------------------------------------
      scene('文献の地図', '競争で読むか、協調で読むかで割れている', [
        '入札額から費用を逆算する方法の原型は、二〇〇〇年の論文です。',
        'ただしこの方法は、企業どうしが競争していると仮定します。',
        '川合と中林は、国の工事約四万二千件で、談合の検出を行いました。',
        '競争と整合しない企業が千社を超え、約一万五千件を落札していました。',
        '競争で読むか、協調で読むか。文献はここで割れています。',
      ], (g, T) => {
        const gpv = card(g, 120, 200, 660, 170, 'GPV（2000）の逆算', '入札額の分布 → 費用の分布\n読んだ深さ：検索結果の要約のみ', C.gray);
        const asm = txt(g, 450, 420, '前提：企業どうしが競争している', { size: 28, fill: C.gray, weight: 700 });
        const kn = card(g, 820, 200, 660, 170, '川合・中林（2022）', '国の建設工事 約 42,000 件で談合を検出\n読んだ深さ：要旨', C.red);
        const num = box(g, 820, 400, 660, 110, '競争と整合しない企業 1,000 社超\n約 15,000 件を落札', { size: 28, stroke: C.red });
        const split = grp(g);
        el('rect', { x: 120, y: 580, width: 660, height: 110, rx: 16, fill: C.panel, stroke: C.gray, 'stroke-width': 3 }, split);
        txt(split, 450, 635, '競争のモデルで読む', { size: 32, weight: 700, fill: C.gray });
        el('rect', { x: 820, y: 580, width: 660, height: 110, rx: 16, fill: C.panel, stroke: C.red, 'stroke-width': 3 }, split);
        txt(split, 1150, 635, '協調のモデルで読む', { size: 32, weight: 700, fill: C.red });
        txt(split, 800, 635, '?', { size: 44, weight: 800, fill: C.yellow });
        return t => {
          show(gpv, t, T[0]); show(asm, t, T[1]);
          show(kn, t, T[2]); show(num, t, T[3]);
          show(split, t, T[4]);
        };
      }),

      // 4 使えるデータ ---------------------------------------------------
      scene('使えるデータ', '全員の入札額は、ポータルでなく調書にある', [
        '一次採点が前提にした調達ポータルには、落札者と落札額しかありません。',
        '負けた入札者の額も予定価格も無いので、入札モデルは推定できません。',
        '全員の入札額は、国土交通省と市の入札調書、つまりPDFに載っています。',
        '費用は無料ですが、二十から三十の市に広げると一、二か月かかります。',
        '注意点として、業者名には個人事業主の氏名が含まれえます。',
        '倫理規定の第四条に関わるので、AIに読ませるかは人が決めます。',
      ], (g, T) => {
        const tb = table(g, 160, 190, 4, 4, 320, 80);
        const head = ['データ', '他の入札額', '一括取得', '区分'];
        const rows = [['調達ポータル', '無い', 'できる', 'T0'], ['関東地整の調書', '有る', 'できない', 'T0 要確認'], ['土浦市の結果', '有る', '半分できる', 'T0 要確認']];
        const hd = grp(g); head.forEach((s, c) => txt(hd, tb.cx(c), tb.cy(0), s, { size: 28, weight: 700 }));
        const colr = (i, c) => (i === 0 && c === 1 ? C.red : i > 0 && c === 1 ? C.green : c === 3 && i > 0 ? C.yellow : C.ink);
        const rg = rows.map((r, i) => { const n = grp(g); r.forEach((s, c) => txt(n, tb.cx(c), tb.cy(i + 1), s, { size: 28, fill: colr(i, c) })); return n; });
        const hi = el('rect', { x: 160, y: 270, width: 1280, height: 80, rx: 6, fill: 'none', stroke: C.red, 'stroke-width': 5 }, g);
        const meta = box(g, 160, 550, 1280, 80, '費用 0 円　20〜30 市で 1〜2 か月（筆者の見積もり）', { size: 30, stroke: C.cyan });
        const eth = box(g, 160, 660, 1280, 100, '業者名に個人事業主の氏名が含まれうる\n倫理規定 第4条：AI に読ませるかは人が決める', { size: 28, stroke: C.orange, weight: 700 });
        return t => {
          show(tb.g, t, T[0]); show(hd, t, T[0]); show(rg[0], t, T[0] + 0.5);
          hi.setAttribute('opacity', Math.min(prog(t, T[1], 0.4), 1 - prog(t, T[2], 0.4)));
          show(rg[1], t, T[2]); show(rg[2], t, T[2] + 0.6);
          show(meta, t, T[3]);
          show(eth, t, T[4]);
        };
      }),

      // 5 識別の源 -------------------------------------------------------
      scene('識別の源', '張り付いた入札からは、費用の上限しか分からない', [
        '費用の分布は、入札額の分布と入札者の数から逆算します。',
        '下限に張り付いた入札からは、費用の上限しか分かりません。',
        '部分識別、つまり幅でしか決まらない見込みです。筆者の見解です。',
        'くじの当選は偶然なので、落札の効果を測る手がかりになりえます。',
        '最大の難所は、談合が疑われる入札を標本から外すかどうかです。',
        '外せば標本が偏り、外さなければ前提が破れます。見る前に決めます。',
      ], (g, T) => {
        const c1 = card(g, 120, 200, 900, 150, '入札額の分布 → 費用の分布', '入札者の数も使う（GPV の逆算）', C.blue);
        const c2 = card(g, 120, 380, 900, 150, '張り付いた入札 → 費用の上限だけ', '部分識別になる見込み（筆者の見解）', C.yellow);
        const c3 = card(g, 120, 560, 900, 150, 'くじの当選 → 偶然の落札', '落札の効果の手がかり（筆者の着想）', C.yellow);
        const d1 = box(g, 120, 300, 620, 160, '談合の疑いを外す\n→ 選ばれた標本になる', { size: 32, stroke: C.red });
        const d2 = box(g, 860, 300, 620, 160, '外さない\n→ モデルの前提が破れる', { size: 32, stroke: C.red });
        const lk = lock(g, 800, 560, 0.7);
        const lt = txt(g, 800, 680, '結果を見る前に決める', { size: 32, fill: C.orange, weight: 700 });
        return t => {
          show(c1, t, T[0], T[4] - 0.4); show(c2, t, T[1], T[4] - 0.4); show(c3, t, T[3], T[4] - 0.4);
          show(d1, t, T[4]); show(d2, t, T[4] + 0.5);
          show(lk, t, T[5] + 1); setLock(lk, prog(t, T[5] + 1.6, 0.8)); show(lt, t, T[5] + 1.6);
        };
      }),

      // 6 競合 ----------------------------------------------------------
      scene('競合', '同じ制度を、強いチームが10年以上追う', [
        'ここが、いちばん大事な点です。',
        '川合、中林、シャサン、オルトナーのチームが、同じ制度を十年以上追っています。',
        '茨城県の市のデータは、シャサンとオルトナーが既に自分で集めています。',
        '日本のデータで入札モデルを推定することも、中林らが済ませています。',
        '勝てるのは、くじに絞った問いと、公開データセットだけです。',
        'ただし検索の回数は途中で上限に達し、調べ切れていません。',
      ], (g, T) => {
        const lines = grp(g);
        const ln = (x, y) => el('line', { x1: 800, y1: 450, x2: x, y2: y, stroke: C.line, 'stroke-width': 3 }, lines);
        const l = [ln(330, 280), ln(1270, 280), ln(330, 620), ln(1270, 620)];
        const me = grp(g);
        el('circle', { cx: 800, cy: 450, r: 120, fill: C.panel, stroke: C.blue, 'stroke-width': 5 }, me);
        txt(me, 800, 450, '本テーマ', { size: 34, weight: 800, fill: C.blue });
        const node = (x, y, s, col) => box(g, x - 250, y - 60, 500, 120, s, { size: 28, stroke: col });
        const kn = node(330, 280, '川合・中林・Chassang・Ortner\n国の入札 約 78,000 件', C.red);
        const co = node(1270, 280, 'Chassang・Ortner（2019）\n茨城県14市を自分で収集', C.red);
        const nk = node(330, 620, '中林ほか\n日本で構造推定は済み', C.gray);
        const gap = box(g, 1040, 560, 460, 120, '空き：くじに絞った問い\nと公開データセット', { size: 28, stroke: C.blue, weight: 700 });
        const lim = txt(g, 1270, 730, '検索は途中で上限。未確認が残る', { size: 26, fill: C.yellow, weight: 700 });
        return t => {
          show(me, t, T[0]);
          [T[1], T[2], T[3], T[4]].forEach((a, i) => { show(l[i], t, a); });
          show(kn, t, T[1]); show(co, t, T[2]); show(nk, t, T[3]);
          show(gap, t, T[4]); show(lim, t, T[5]);
        };
      }),

      // 7 最初の6か月と撤退条件 ------------------------------------------
      scene('6か月と撤退', 'くじが少なければ、1か月目で止める', [
        '最初の一か月で規約を確かめ、土浦市の調書を全年度ぶん表にします。',
        'くじの入札が五パーセント未満か三百件未満なら、くじの問いをやめます。',
        '二か月目に、必要な項目がそろう市が五市未満なら、やめます。',
        '読み取りの正答率が九十八パーセント未満のまま直らなくても、やめます。',
        '三か月目に合成データで回収を点検し、結果を見る前の論文でロックします。',
      ], (g, T) => {
        const M = ['規約\n土浦市', '他市へ\n拡大', 'モデル\nロック', '推定', 'くじ分析\n監査', '草稿\n公開準備'];
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
          box(n, X(i) + 100 - 20, y - 40, 920, 80, s, { size: 28, stroke: C.red });
          return n;
        };
        const s1 = stop(0, 440, 'くじが 5% 未満 または 300 件未満 → くじの問いをやめる');
        const s2 = stop(1, 560, '全入札額と下限がそろう市が 5 市未満 → やめる');
        const s3 = stop(1, 680, '読み取りの正答率 98% 未満のまま → やめる');
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
        'AIの下書きは、条件つきで勧める、です。元の形のままでは勧めません。',
        '勝ち筋は、くじに問いを絞り、全入札者の公開データセットを作ることです。',
        '懸念は、談合の疑いで競争の仮定が崩れることと、強い競合です。',
        '絞った問いを認めるか。強いチームと同じ土俵に立つか。',
        '業者名をAIに読ませてよいか。決めるのは、人です。',
      ], (g, T) => {
        const draft = box(g, 120, 190, 760, 90, 'AI の下書き：条件つきで勧める', { size: 32, stroke: C.purple, weight: 700 });
        const win = card(g, 120, 320, 760, 170, '勝ち筋', 'くじと最低制限価格に絞る\n全入札者の公開データセットを作る', C.green);
        const risk = card(g, 120, 530, 760, 170, '懸念', '談合の疑い：競争の仮定が崩れる\n有力チームが同種のデータを持つ', C.red);
        const q = box(g, 960, 320, 540, 300, '人が決めること\n\nくじへの絞り込みを認めるか\n強いチームと同じ土俵に立つか\n業者名を AI に読ませてよいか', { size: 28, stroke: C.orange });
        const gt = gate(g, 1230, 250, 40);
        return t => {
          show(draft, t, T[0]); show(win, t, T[1]); show(risk, t, T[2]);
          show(gt, t, T[3]); show(q, t, T[3] + 0.3);
        };
      }),
    ],
  });
})();
