#!/bin/bash
# 動画ファイルの点検（Node なしで動く。macOS 付属の JavaScriptCore を使う）。
#   tools/check_video.sh [--shots <出力先>] <動画ディレクトリ> [...]      例: tools/check_video.sh guide/video
#   --shots: 各字幕の1.5秒後と各シーンの終わりの絵を SVG で書き出す（ブラウザが無いときの目視用。
#            qlmanage -t -s 1600 -o <png の出力先> <出力先>/*.svg で PNG にできる）
# 調べること:
#   - lib.js / player.js / videos/*.js が構文として正しい
#   - 全シーンの setup() と、t = 0・中間・終端・字幕の各時刻での update(t) が例外を出さない
#   - 属性に NaN / undefined / Infinity が入らない
#   - 字幕の規約: 1文40字以内、時刻が昇順、表示時間が「文字数÷7」秒以上、dur >= 最後の字幕+3秒
#   - id / title / subtitle / hook があり、シーンに title がある
# 警告（落とさない）: y > 780（字幕の領域）に置かれた文字、22px 未満の文字、長すぎる・短すぎる動画
# 終了コード: 0 = 通った、1 = 問題あり、2 = 使い方の誤り・実行環境なし
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"
SHOTS=""
if [ "${1:-}" = "--shots" ]; then SHOTS="${2:-}"; shift 2 || true; mkdir -p "$SHOTS" && SHOTS="$(cd "$SHOTS" && pwd)"; fi
[ $# -ge 1 ] || { sed -n '2,14p' "$0"; exit 2; }
[ -x "$JSC" ] || { echo "jsc が無い: $JSC（JSC=<パス> で指定できる）"; exit 2; }

HARNESS="$(mktemp -t check_video.XXXXXX)"
trap 'rm -f "$HARNESS"' EXIT
cat > "$HARNESS" <<'JS'
var args = arguments, shotsDir = args[0], libPath = args[1], playerPath = args[2], files = args.slice(3);
var problems = 0, warnings = 0;
function bad(msg) { problems++; print('  NG   ' + msg); }
function warn(msg) { warnings++; print('  注意 ' + msg); }

// ---- 最小の DOM スタブ ----
function Node(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.textContent = ''; this.parent = null; }
Node.prototype.setAttribute = function (k, v) {
  var s = String(v);
  if (/NaN|undefined|Infinity/.test(s)) throw new Error('<' + this.tag + '> の属性 ' + k + ' に不正な値: ' + s);
  this.attrs[k] = s;
};
Node.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
Node.prototype.appendChild = function (c) { if (c.parent) c.parent.removeChild(c); c.parent = this; this.children.push(c); return c; };
Node.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parent = null; return c; };
// path の長さと途中の点（M L H V Q Z だけ。それ以外の命令を含む path は長さ 100 の水平線とみなす）
function polyline(d) {
  var tk = String(d).match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], pts = [], i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  var num = function () { return parseFloat(tk[i++]); };
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'M') { x = num(); y = num(); sx = x; sy = y; pts.push([x, y]); cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); pts.push([x, y]); }
    else if (cmd === 'H') { x = num(); pts.push([x, y]); }
    else if (cmd === 'V') { y = num(); pts.push([x, y]); }
    else if (cmd === 'Q') { var cx = num(), cy = num(), ex = num(), ey = num();
      for (var k = 1; k <= 24; k++) { var u = k / 24; pts.push([(1 - u) * (1 - u) * x + 2 * u * (1 - u) * cx + u * u * ex, (1 - u) * (1 - u) * y + 2 * u * (1 - u) * cy + u * u * ey]); }
      x = ex; y = ey; }
    else if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; pts.push([x, y]); }
    else return null;
  }
  return pts.length > 1 ? pts : null;
}
Node.prototype.getTotalLength = function () {
  var p = polyline(this.attrs.d), L = 0; if (!p) return 100;
  for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};
Node.prototype.getPointAtLength = function (l) {
  var p = polyline(this.attrs.d); if (!p) return { x: l, y: 0 };
  for (var i = 1; i < p.length; i++) {
    var seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (l <= seg && seg > 0) return { x: p[i - 1][0] + (p[i][0] - p[i - 1][0]) * l / seg, y: p[i - 1][1] + (p[i][1] - p[i - 1][1]) * l / seg };
    l -= seg;
  }
  return { x: p[p.length - 1][0], y: p[p.length - 1][1] };
};
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function serialize(n) {
  var a = ''; for (var k in n.attrs) a += ' ' + k + '="' + esc(n.attrs[k]) + '"';
  var inner = esc(n.textContent); for (var i = 0; i < n.children.length; i++) inner += serialize(n.children[i]);
  return '<' + n.tag + a + '>' + inner + '</' + n.tag + '>';
}
function shot(name, root, sub) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" font-family="\'Hiragino Sans\',\'Noto Sans JP\',sans-serif">'
    + serialize(root)
    + (sub ? '<rect x="96" y="806" width="1408" height="62" rx="10" fill="#05080f" opacity="0.78"/><text x="800" y="850" fill="#eef2f9" font-size="34" text-anchor="middle">' + esc(sub) + '</text>' : '')
    + '</svg>';
  writeFile(shotsDir + '/' + name + '.svg', s);
}
Object.defineProperty(Node.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
var document = { createElementNS: function (ns, tag) { return new Node(tag); } };
var VIDEOS = [];
function VIDEO(v) { VIDEOS.push(v); }

function tryLoad(path) {
  try { load(path); return true; } catch (e) { bad(path + ': ' + e + (e.line ? '（' + e.line + ' 行）' : '')); return false; }
}
function walk(n, f) { f(n); for (var i = 0; i < n.children.length; i++) walk(n.children[i], f); }
function textOf(n) { var s = n.textContent; for (var i = 0; i < n.children.length; i++) s += textOf(n.children[i]); return s; }

try { checkSyntax(playerPath); } catch (e) { bad(playerPath + ': ' + e); }
if (tryLoad(libPath)) {
  files.forEach(function (f) {
    var before = VIDEOS.length;
    if (!tryLoad(f)) return;
    if (VIDEOS.length === before) return bad(f + ': VIDEO({...}) が呼ばれていない');
    VIDEOS.slice(before).forEach(function (v) { checkVideo(f, v); });
  });
}

function checkVideo(file, v) {
  var where = file.replace(/^.*\//, '') + ' ' + (v.id || '?');
  ['id', 'title', 'subtitle', 'hook'].forEach(function (k) { if (!v[k]) bad(where + ': ' + k + ' が無い'); });
  if (v.hook && v.hook.length > 40) bad(where + ': hook が40字を超える（' + v.hook.length + '字）');
  if (!Array.isArray(v.scenes) || !v.scenes.length) return bad(where + ': scenes が空');
  var total = 0;
  v.scenes.forEach(function (s, i) {
    var w = where + ' シーン' + (i + 1) + '「' + (s.title || '') + '」';
    if (!s.title) bad(w + ': title が無い');
    if (!(s.dur > 0)) return bad(w + ': dur が正の数でない');
    total += s.dur;
    var subs = s.subs || [], times = [0, s.dur / 2, s.dur];
    subs.forEach(function (p, k) {
      var at = p[0], str = String(p[1]);
      times.push(at, at + 0.3, at + 1.5);
      if (str.length > 40) bad(w + ': 字幕が40字を超える（' + str.length + '字）「' + str + '」');
      if (k && at <= subs[k - 1][0]) bad(w + ': 字幕の時刻が昇順でない（' + at + '）');
      var until = k + 1 < subs.length ? subs[k + 1][0] : s.dur;
      if (until - at < str.length / 7 - 1e-9) bad(w + ': 字幕の表示が短い（' + (until - at).toFixed(1) + '秒 < ' + (str.length / 7).toFixed(1) + '秒）「' + str + '」');
    });
    if (subs.length && s.dur < subs[subs.length - 1][0] + 3) bad(w + ': dur が「最後の字幕+3秒」より短い');
    var root = new Node('g'), update;
    try { update = s.setup(root); } catch (e) { return bad(w + ': setup() で例外: ' + e); }
    if (typeof update !== 'function') return bad(w + ': setup() が t => {...} を返していない');
    for (var k = 0; k < times.length; k++) {
      var t = Math.min(s.dur, Math.max(0, times[k]));
      try { update(t); update(t); } catch (e) { bad(w + ': update(' + t.toFixed(1) + ') で例外: ' + e); break; }
    }
    if (shotsDir) {
      var pad = function (x) { return (x < 10 ? '0' : '') + x; };
      try {
        subs.forEach(function (p, k) { update(Math.min(s.dur, p[0] + 1.5)); shot(v.id + '_s' + pad(i + 1) + '_k' + pad(k + 1), root, p[1]); });
        update(s.dur); shot(v.id + '_s' + pad(i + 1) + '_end', root, subs.length ? subs[subs.length - 1][1] : '');
      } catch (e) { bad(w + ': 絵の書き出しで例外: ' + e); }
    }
    walk(root, function (n) {
      if (n.tag !== 'text') return;
      var y = parseFloat(n.attrs.y), size = parseFloat(n.attrs['font-size']);
      if (y > 780) warn(w + ': y=' + y + ' の文字が字幕の領域にある「' + textOf(n) + '」（グループの移動は見ていない）');
      if (size < 22) warn(w + ': ' + size + 'px の文字「' + textOf(n) + '」（22px 以上にする）');
    });
  });
  var m = Math.floor(total / 60), sec = Math.round(total % 60);
  print('  ' + (v.id || '?') + ': ' + v.scenes.length + ' シーン、' + m + '分' + sec + '秒（タイトルカード6秒を除く）');
  if (total > 600) warn(where + ': 10分を超える');
}
print('RESULT ' + problems + ' ' + warnings);
JS

status=0
for dir in "$@"; do
  d="$(cd "$dir" 2>/dev/null && pwd)" || { echo "$dir: ディレクトリが無い"; status=1; continue; }
  echo "$dir"
  [ -f "$d/index.html" ] || { echo "  NG   index.html が無い"; status=1; }
  shopt -s nullglob; vids=("$d"/videos/*.js); shopt -u nullglob
  [ ${#vids[@]} -gt 0 ] || { echo "  NG   videos/*.js が無い"; status=1; continue; }
  for v in "${vids[@]}"; do
    grep -q "videos/$(basename "$v")" "$d/index.html" 2>/dev/null || { echo "  NG   index.html が videos/$(basename "$v") を読み込んでいない"; status=1; }
  done
  out="$("$JSC" "$HARNESS" -- "$SHOTS" "$ROOT/common/video/lib.js" "$ROOT/common/video/player.js" "${vids[@]}" 2>&1)"
  echo "$out" | grep -v '^RESULT '
  res="$(echo "$out" | grep '^RESULT ' | tail -1)"
  if [ -z "$res" ]; then echo "  NG   点検が途中で止まった"; status=1
  else
    n_bad="$(echo "$res" | cut -d' ' -f2)"; n_warn="$(echo "$res" | cut -d' ' -f3)"
    echo "  問題 $n_bad 件、注意 $n_warn 件"
    [ "$n_bad" = "0" ] || status=1
  fi
done
exit $status
