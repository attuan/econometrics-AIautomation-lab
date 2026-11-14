// V01 仮説 H1 の研究提案ビデオ（雛形）。内容の正本は ../paper/main.tex。規約は common/video/STYLE.md。
// 数値は正本にあるものだけ使う。予想値は画面と字幕で「予想」「仮定」と言う。実測のように言わない。
// 点検: tools/check_video.sh <project>/video
(() => {
  VIDEO({
    id: 'V01', title: '仮説の短い名前', subtitle: '問いを一文で',
    hook: 'タイトルカードで流す一言を書く。',
    scenes: [
      // scene(サイドバー用の短い名前, 主張の形の見出し, 字幕の配列, (g, T) => t => {...})
      // T[i] は i 番目の字幕が出る時刻（秒）。要素は「話す順」に show() する。
      scene('ひと目でつかむ', '何の変動で、何を測るか', [
        'この提案が確かめたいことを、一文で言います。',
        '使うデータと、比べる相手を言います。',
      ], (g, T) => {
        const ax = axes(g, 300, 220, 700, 440, [0, 10], [0, 10], { xlabel: '時点', ylabel: '結果変数（模式図）' });
        const ctl = fitline(g, ax, 0, 2, 10, 4, C.gray);      // 対照群 = 灰
        const trt = fitline(g, ax, 0, 3, 10, 7, C.blue);      // 処置群 = 青
        const note = txt(g, 1250, 440, '用語 = 一言の意味', { size: 30, fill: C.mute });
        return t => {                                          // t だけで絵が決まるように書く
          drawLine(ctl, prog(t, T[0] + 0.5, 1.2));
          drawLine(trt, prog(t, T[1], 1.2));
          show(note, t, T[1] + 0.8);
        };
      }),

      scene('研究仮説', '何がいくつなら、支持か棄却か', [
        '仮説と、推定の対象を言います。',
        '成功の基準と、棄却の条件を数値で言います。',
      ], (g, T) => {
        const ok = coef(g, 500, 320, 500, 0.6, 0.3, 0.9, C.green);   // 支持される場合（予想）
        const ng = coef(g, 500, 480, 500, 0.05, -0.2, 0.3, C.red);   // 棄却される場合（予想）
        el('line', { x1: 500, x2: 500, y1: 240, y2: 560, stroke: C.mute, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
        const tag = txt(g, 1480, 205, '予想（筆者の仮定）', { size: 24, fill: C.mute, anchor: 'end' });
        return t => { show(tag, t, 0.3); show(ok, t, T[1]); show(ng, t, T[1] + 1.2); };
      }),

      scene('判断と次の一手', 'Go / No-Go の基準と、最初の一歩', [
        '進むか、やめるかの基準を言います。',
        '最初にやることを、一つだけ言います。',
      ], (g, T) => {
        const gt = gate(g, 500, 420, 60);                             // 関門 = 人の判断
        const next = box(g, 700, 370, 560, 100, '次の一手：誰が・いつまでに・何を', { size: 30, stroke: C.orange });
        return t => { show(gt, t, T[0]); show(next, t, T[1]); };
      }),
    ],
  });
})();
