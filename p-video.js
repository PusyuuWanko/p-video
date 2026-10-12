/*****************************************
  *----------------------------------
  |  ThisScriptVersion: 2.6.1     |
  |  © ISAMI ABE                  |
  |  LastUpdate: 2026-10-12       |
  |  License: MIT License         |
  |  (^U^)p-video.js              |
----------------------------------*
******************************************/

/*

<p-video> - 依存なし・1ファイルで動く動画プレイヤー

使い方:
  <script src="p-video.js"></script>
  <p-video src="movie.mp4"></p-video>

属性:
  src      … 動画のURL(必須。あとから変えても読み直します)
  poster   … 再生前に出す画像(任意)
  preload  … none / metadata / auto(既定 metadata)
  loop, muted, autoplay … <video> と同じ意味
  color    … プレイヤーの色(既定は緑 #22c55e。シークバー・つまみ・再生ボタンのホバー・選択中の印・フォーカスの枠)。
             CSS の色ならどれでも書けます(例 color="#ff3d6e" / color="tomato" / color="rgb(0 170 255)")。
             CSS の --p-video-accent より優先します。色として読めない値は無視して既定の色のままにします。
  aspect   … 映像の形(任意)。ファイルに書かれた縦横比が狂っている動画のために使います。
             auto  … ファイルの設定どおり(既定)
             pixel … 画素の並びどおり(正方形の画素として映す。ブラウザが対応しているときだけ)
             16:9 / 4:3 / 9:16 / 1.5 など … その比率に合わせて映す
             見る人が設定メニューの「映像の形」で選んだものは、この属性より優先します(動画ごとに覚えます)。

見た目の調整(置く側のCSSで指定できます):
  p-video { width: 640px; --p-video-ratio: 4 / 3; --p-video-accent: #ff3d6e; --p-video-radius: 12px; }
  --p-video-ratio … 枠の縦横比(既定 16 / 9)。動画の比率ではなく、プレイヤーの枠の比率です。

操作(要素から呼べます):
  el.play() / el.pause() / el.paused / el.currentTime / el.duration / el.video(中の <video>)

キーボード(プレイヤーにフォーカスがあるとき):
  Space・K 再生/一時停止  ← → 5秒戻る/進む  ↑ ↓ 音量  M 消音  F 全画面

マウス・タッチ(動画の上):
  1回押す … 再生/一時停止
  続けて押す … 左の1/3は10秒戻る・右の1/3は10秒進む・まん中は全画面
                左右は押し続けるほど10秒ずつ重ねて動きます(3回で20秒、4回で30秒)。

表示する言葉:
  置いたページ(または近い祖先)の lang が ja で始まれば日本語、それ以外は英語です。
  見る人は設定メニューの「言語 / Language」で 自動・日本語・English を選べます(ブラウザに覚えます)。
  変えたいときは、要素を作る前に PVideo.labels.ja.play = "..." のように差し替えてください。

設定メニューの「情報」:
  バージョン・著作権とライセンス・通信状態・読み込み済みの量・準備状態・ファイルの指定する大きさ・
  実際の画素数・落ちたコマ数を出します。表示中は動画の出来事のたびに書き換わります。
  「情報をコピー」で、問い合わせに貼れる形の文字としてコピーできます。
  【動画の URL(src)は出さないこと】置き場所のフォルダ名や、URL に付けた札が見えてしまうためです。

■ 帯で比率を保つ仕組み(YouTube のプレイヤーと同じ形)
  1. 枠の縦横比は、動画が何であっても決まった比率(既定 16:9、--p-video-ratio)です。
     置く側は幅だけ決めれば、高さは比率から決まります。
  2. 動画は枠の中に「はみ出さず・縦横比を保って」映します(object-fit: contain)。
     枠と比率が違う分は、上下(横長すぎる動画)か左右(縦長の動画)の黒い帯になります。
  枠の大きさが何で決まっても(幅・置く側の height・max-height・全画面)、2 があるので映像は
  切れも歪みもせず、比率の違いは必ず帯で吸収されます。
  【枠の比率を動画に合わせる作りに戻さないこと】v2.0.0 まではそうしていて、動画ごとに枠の形が
   変わり、並べたときに高さがばらばらになりました。帯で吸収するのが今の約束です。
  【object-fit を cover や fill に変えないこと】cover は映像の端が切れ、fill は歪みます。
   ただし「映像の形」を選んだときだけは、<video> の箱そのものを選んだ比率の形にして(枠の中に収まる
   いちばん大きな形・まん中寄せ)、そこへ fill で映します。ファイルの縦横比が狂っているのを、わざと
   歪ませて正しい形へ戻すためです。帯で吸収する約束は同じで、箱の外が帯になります。
   【このとき動画の上の操作は .stage で受けること】<video> が枠より小さくなり、帯の上を押しても
   <video> には届かないためです。
  【動画を canvas へ描き写す作りに戻さないこと】以前はそうしていて、canvas の置き方が外のCSSや
   ずらしの指定に左右され、映像の上下が切れていました。再生中ずっと描き写す分の負荷もかかり、
   一時停止中は何も映りませんでした。

■ 映像の形(ファイルの縦横比が狂っている動画のため)
  ブラウザは MP4 に書かれた表示用の大きさ(画素の縦横比などを含む)で映像の形を決めます。ここが
  壊れていると、映像そのものは正しくても縦や横に伸びて映ります。設定メニューの「映像の形」で
    ファイルどおり … 今まで通り(ブラウザに任せる)
    画素どおり     … 実際に出てきた映像の画素数(VideoFrame の visibleRect)の比率で映す。
                     画素の縦横比の指定が狂っている動画はこれで直ります。VideoFrame の無いブラウザでは出しません。
    16:9 など      … 決まった比率で映す
    細かく合わせる … つまみで横の伸び縮みを自由に決める
  から選べます。選んだものは見る人のブラウザに動画の src ごとに覚えます(localStorage。使えなければ覚えないだけ)。
  【選んだものを置く側の aspect 属性より優先すること】置く側の指定が間違っていても、見る人が直せるようにするためです。

■ 外のCSSに崩されないこと(単体で動くための約束)
  中身は Shadow DOM に入れ、見た目はこのファイルの中のCSSだけで決めます。置く側のページの
  button や input の指定が、プレイヤーのボタンへ漏れてこないようにするためです。
  置く側から変えてよいのは、要素そのものの大きさ・角丸・枠線と、上の --p-video-* の値だけです。
  【ほかのファイル(CSS・画像・フォント)を読みに行かないこと】アイコンも中に書いてあります。
  1ファイルを置くだけで動く、が崩れます。
*/

(function () {
  "use strict";

  if (typeof window === "undefined" || !window.customElements || window.customElements.get("p-video")) {
    return;
  }

  const LABELS = {
    ja: {
      play: "再生", pause: "一時停止", mute: "消音", unmute: "消音を解除", volume: "音量",
      fullscreen: "全画面", exitFullscreen: "全画面を終了", pip: "ピクチャーインピクチャー",
      settings: "設定", speed: "再生速度", loop: "ループ", on: "オン", off: "オフ", normal: "標準",
      seek: "再生位置", player: "動画プレイヤー", pipActive: "ピクチャーインピクチャーで再生中",
      error: "動画を読み込めませんでした", seconds: "{n}秒",
      aspect: "映像の形", aspectAuto: "ファイルどおり", aspectPixel: "画素どおり", aspectFine: "細かく合わせる",
      language: "言語 / Language", auto: "自動",
      info: "情報", version: "バージョン", copyright: "著作権", network: "通信状態", buffered: "読み込み済み",
      ready: "準備状態", fileSize: "ファイルの指定", pixelSize: "実際の画素", frames: "落ちたコマ",
      copyInfo: "情報をコピー", copied: "コピーしました", unknown: "不明", ahead: "{n}秒先まで",
      netEmpty: "未開始", netIdle: "待機中", netLoading: "読み込み中", netNoSource: "読み込めるファイルがありません",
      netWaiting: "読み込み待ち(再生が止まっています)",
      errAborted: "読み込みが中断されました", errNetwork: "通信エラー", errDecode: "ファイルを読み解けません",
      errSource: "対応していない形式か、見つかりません",
      ready0: "情報なし", ready1: "大きさ・長さのみ", ready2: "今のコマのみ", ready3: "少し先まで",
      ready4: "最後まで再生できる見込み"
    },
    en: {
      play: "Play", pause: "Pause", mute: "Mute", unmute: "Unmute", volume: "Volume",
      fullscreen: "Full screen", exitFullscreen: "Exit full screen", pip: "Picture-in-picture",
      settings: "Settings", speed: "Speed", loop: "Loop", on: "On", off: "Off", normal: "Normal",
      seek: "Seek", player: "Video player", pipActive: "Playing in picture-in-picture",
      error: "Could not load the video", seconds: "{n}s",
      aspect: "Aspect ratio", aspectAuto: "As in file", aspectPixel: "Square pixels", aspectFine: "Fine-tune",
      language: "言語 / Language", auto: "Auto",
      info: "Info", version: "Version", copyright: "Copyright", network: "Network", buffered: "Buffered",
      ready: "Ready state", fileSize: "Size in file", pixelSize: "Actual pixels", frames: "Dropped frames",
      copyInfo: "Copy info", copied: "Copied", unknown: "Unknown", ahead: "{n}s ahead",
      netEmpty: "Not started", netIdle: "Idle", netLoading: "Loading", netNoSource: "No playable file",
      netWaiting: "Waiting for data (playback stalled)",
      errAborted: "Loading was aborted", errNetwork: "Network error", errDecode: "Could not decode the file",
      errSource: "Unsupported format or not found",
      ready0: "No data", ready1: "Size and length only", ready2: "Current frame only", ready3: "A little ahead",
      ready4: "Can likely play to the end"
    }
  };

  // 情報の画面に出す版と著作権。【版は先頭の ThisScriptVersion と必ず同じにすること】
  // ずれると、見る人が知らせてくれた版と実際の中身が食い違い、どの版の不具合か分からなくなります。
  const VERSION = "2.6.1";
  const COPYRIGHT = "© ISAMI ABE";
  const LICENSE = "MIT License";
  const HOMEPAGE = "https://github.com/PusyuuWanko/p-video";
  // 見る人が選んだ言語を覚えておく localStorage の鍵。動画ごとではなく、すべてのプレイヤーで共通です。
  const LANG_STORE = "p-video-lang";

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  // 「映像の形」で選べる決まった比率。名前はそのまま表示にも使います。
  const ASPECTS = [["16:9", 16 / 9], ["4:3", 4 / 3], ["1:1", 1], ["3:4", 3 / 4], ["9:16", 9 / 16]];
  // 「細かく合わせる」のつまみの幅。つまみの値 v に対して比率は 2^v(1/4 〜 4)です。
  // 伸ばす側と縮める側で同じ手ざわりにするため、比率そのものでなく指数で動かします。
  const FINE_RANGE = 2;
  // 見る人が選んだ形を覚えておく localStorage の鍵の頭。後ろに動画の src を付けます。
  const ASPECT_STORE = "p-video-aspect:";
  // 再生中に操作が止まってから、操作バーとカーソルを隠すまでの時間(ミリ秒)。
  const IDLE_MS = 2500;
  // 動画の上を続けて押したとみなす間隔(ミリ秒)と、左右を続けて押したときに1回で動く秒数。
  const DOUBLE_MS = 350;
  const SKIP_SECONDS = 10;
  // 戻る/進むの印を出しておく時間(ミリ秒)。最後に押してから数えます。
  const SKIP_BADGE_MS = 700;

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm16.59 3L23 9.59 21.59 8.17 19.17 10.6 16.76 8.17 15.34 9.59 17.76 12l-2.42 2.41 1.42 1.42 2.41-2.42 2.42 2.42L23 14.41z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 3v-3h2v5h-5v-2h3z"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h2v5H5V8h3V5zm6 0h2v3h3v2h-5V5zM5 14h5v5H8v-3H5v-2zm9 0h5v2h-3v3h-2v-5z"/></svg>',
    pip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 7h-8v6h8V7zm2-4H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94a7.14 7.14 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.88 2h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7 7 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 8.48a.5.5 0 0 0 .12.64l2.03 1.58a7.14 7.14 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96a7 7 0 0 0 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7 7 0 0 0 1.63-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>'
  };

  const STYLE = `
    :host {
      --p-video-accent: #22c55e;
      --p-video-radius: 12px;
      --p-video-bg: #000;
      display: block;
      position: relative;
      aspect-ratio: var(--p-video-ratio, 16 / 9);
      background: var(--p-video-bg);
      border-radius: var(--p-video-radius);
      overflow: hidden;
      color: #fff;
      font: 13px/1.2 system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif;
      user-select: none;
      -webkit-user-select: none;
      outline: none;
    }
    :host([hidden]) { display: none; }
    :host(:focus-visible) { box-shadow: 0 0 0 3px var(--p-video-accent); }
    :host([data-fullscreen]) { border-radius: 0; }
    :host([data-idle]) { cursor: none; }

    *, *::before, *::after { box-sizing: border-box; }
    button { font: inherit; color: inherit; }

    /* 狭いときの詰め方は、画面の幅ではなくプレイヤー自身の幅で決めます(下の @container)。
       同じページに大小のプレイヤーが並んでも、それぞれに合った操作バーになります。
       「映像の形」で枠の高さも使うため size にしています(.stage は枠いっぱいに置くので、中身で大きさが変わりません)。 */
    .stage { position: absolute; inset: 0; container-type: size; }
    video {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: contain; background: var(--p-video-bg); display: block;
    }
    /* 映像の形を選んだとき: 箱を --p-video-picture(横÷縦)の形で枠に収まる最大の大きさにし、fill で映します。 */
    :host([data-aspect]) video {
      inset: auto; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: min(100cqw, calc(100cqh * var(--p-video-picture)));
      height: min(100cqh, calc(100cqw / var(--p-video-picture)));
      object-fit: fill;
    }

    .center {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 68px; height: 68px; border: 0; border-radius: 50%; padding: 0; cursor: pointer;
      background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      display: grid; place-items: center; transition: transform 0.15s, background 0.15s, opacity 0.2s;
    }
    .center:hover { background: var(--p-video-accent); transform: translate(-50%, -50%) scale(1.06); }
    .center:focus-visible { outline: 3px solid var(--p-video-accent); outline-offset: 2px; }
    .center svg { width: 34px; height: 34px; fill: #fff; margin-left: 3px; }
    :host([data-playing]) .center { opacity: 0; pointer-events: none; }

    .notice {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      max-width: calc(100% - 24px); padding: 8px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.65);
      font-size: 13px; text-align: center; display: none; pointer-events: none;
    }
    .skip {
      position: absolute; top: 50%; transform: translateY(-50%);
      padding: 8px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.55);
      font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap;
      opacity: 0; transition: opacity 0.2s; pointer-events: none;
    }
    .skip.back { left: 8%; }
    .skip.forward { right: 8%; }
    .skip.show { opacity: 1; }
    .spinner {
      position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px;
      border: 4px solid rgba(255, 255, 255, 0.25); border-top-color: #fff; border-radius: 50%;
      animation: spin 0.8s linear infinite; display: none; pointer-events: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    :host([data-waiting]) .spinner { display: block; }
    :host([data-waiting]) .center { opacity: 0; pointer-events: none; }
    :host([data-pip]) .notice.pip, :host([data-error]) .notice.error { display: block; }
    :host([data-pip]) .center, :host([data-error]) .center { display: none; }

    .bar {
      position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 10px 6px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
      transition: opacity 0.25s, transform 0.25s;
    }
    :host([data-idle]) .bar { opacity: 0; transform: translateY(8px); pointer-events: none; }

    .seek { position: relative; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
    .seek:focus-visible { outline: none; }
    .track { position: relative; width: 100%; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.25); transition: height 0.12s; }
    .seek:hover .track, .seek.dragging .track { height: 6px; }
    .seek:focus-visible .track { box-shadow: 0 0 0 2px var(--p-video-accent); }
    .buffered, .played { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; width: 0; }
    .buffered { background: rgba(255, 255, 255, 0.4); }
    .played { background: var(--p-video-accent); }
    .thumb {
      position: absolute; top: 50%; left: 0; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px;
      border-radius: 50%; background: var(--p-video-accent); transform: scale(0); transition: transform 0.12s;
    }
    .seek:hover .thumb, .seek.dragging .thumb, .seek:focus-visible .thumb { transform: scale(1); }

    .row { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
    .spacer { flex: 1; }
    .btn {
      flex: none; width: 36px; height: 36px; border: 0; padding: 0; border-radius: 8px; background: transparent;
      display: grid; place-items: center; cursor: pointer; transition: background 0.15s;
    }
    .btn:hover { background: rgba(255, 255, 255, 0.15); }
    .btn:focus-visible { outline: 2px solid var(--p-video-accent); outline-offset: -2px; }
    .btn svg { width: 22px; height: 22px; fill: #fff; }
    .btn[hidden] { display: none; }
    .time { padding: 0 8px; font-variant-numeric: tabular-nums; white-space: nowrap; }

    .volume { display: flex; align-items: center; }
    .volume input {
      width: 0; opacity: 0; margin: 0; transition: width 0.2s, opacity 0.2s, margin 0.2s;
      accent-color: #fff; cursor: pointer;
    }
    .volume:hover input, .volume:focus-within input { width: 70px; opacity: 1; margin: 0 6px 0 2px; }

    .menu {
      position: absolute; right: 10px; bottom: 58px; min-width: 190px; max-width: calc(100% - 20px);
      max-height: calc(100% - 70px); overflow-y: auto;
      padding: 6px; border-radius: 10px; background: rgba(28, 28, 28, 0.92);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: none;
    }
    .menu.open { display: block; }
    .menu button {
      display: flex; justify-content: space-between; gap: 16px; width: 100%; padding: 9px 12px;
      border: 0; border-radius: 6px; background: transparent; cursor: pointer; text-align: left;
    }
    .menu button:hover, .menu button:focus-visible { background: rgba(255, 255, 255, 0.12); outline: none; }
    .menu .value { opacity: 0.7; }
    .menu button[aria-checked="true"] .label::before { content: "✓ "; color: var(--p-video-accent); }
    .menu .inforow { display: flex; justify-content: space-between; gap: 16px; padding: 6px 12px; }
    .menu .inforow .value { text-align: right; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
    .menu .home { display: block; padding: 6px 12px; color: var(--p-video-accent); font-size: 12px; overflow-wrap: anywhere; }
    .menu .home:focus-visible { outline: 2px solid var(--p-video-accent); outline-offset: -2px; border-radius: 6px; }
    .menu .fine { display: flex; flex-direction: column; gap: 6px; padding: 9px 12px; }
    .menu .fine .head { display: flex; justify-content: space-between; gap: 16px; }
    .menu .fine input { width: 100%; margin: 0; accent-color: var(--p-video-accent); cursor: pointer; }

    @container (max-width: 380px) {
      .volume input { display: none; }
      .btn { width: 30px; height: 30px; }
      .btn svg { width: 20px; height: 20px; }
      .time { padding: 0 4px; font-size: 12px; }
      .center { width: 56px; height: 56px; }
      .center svg { width: 28px; height: 28px; }
      .bar { padding: 22px 6px 4px; }
      .menu { bottom: 48px; right: 6px; }
    }
    /* 狭くなったら、時間 → 音量・設定 の順に隠し、最後はボタンを小さくします。
       【再生・PiP・全画面は隠さないこと】PiP を 280px 以下で隠していたため、30vw で並べるページでは
        ウィンドウを少し狭めるだけでボタンが見当たらなくなりました。3つなら 120px 程度でも収まります。 */
    @container (max-width: 280px) {
      .time { display: none; }
    }
    @container (max-width: 190px) {
      .btn.mute, .btn.settings { display: none; }
    }
    @container (max-width: 130px) {
      .btn { width: 26px; height: 26px; }
      .btn svg { width: 18px; height: 18px; }
      .bar { padding: 18px 4px 3px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition: none !important; animation-duration: 0s !important; }
    }
  `;

  function formatTime(seconds) {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, "0");
    return h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + s : m + ":" + s;
  }

  /**
   * "16:9" "16/9" "1.5" を 横÷縦 の数にします。読めない値・0 以下は 0(=指定なし)です。
   */
  function parseRatio(text) {
    const parts = String(text || "").split(/[:\/]/);
    let ratio = 0;
    if (parts.length === 1) {
      ratio = Number(parts[0]);
    } else if (parts.length === 2) {
      ratio = Number(parts[0]) / Number(parts[1]);
    } else {
      ratio = 0;
    }
    return (Number.isFinite(ratio) && ratio > 0) ? ratio : 0;
  }

  /**
   * 比率を表示用の文字にします。決まった比率に近ければその名前("16:9")、そうでなければ "1.85:1"。
   */
  function formatRatio(ratio) {
    const named = ASPECTS.find((entry) => Math.abs(entry[1] - ratio) / ratio < 0.01);
    return named ? named[0] : ratio.toFixed(2) + ":1";
  }

  class PVideo extends HTMLElement {
    static get observedAttributes() {
      return ["src", "poster", "loop", "muted", "color", "aspect"];
    }

    constructor() {
      super();
      this._built = false;
      // 映像の形。choice は "auto" / "pixel" / 比率の数(横÷縦)。pixelRatio は実際の画素数の比率(分からなければ 0)。
      this._aspectChoice = "auto";
      this._pixelRatio = 0;
      // 実際の画素数の表示用("1920×1080")。分からなければ ""。情報の画面で使います。
      this._pixelSize = "";
      // 表示する言葉。"auto"(ページの lang に従う) / "ja" / "en"。見る人が設定で選びます。
      this._lang = "auto";
      this._idleTimer = 0;
      this._menuView = "main";
      this._tap = null;
      this._skipTimer = 0;
    }

    connectedCallback() {
      if (!this._built) {
        this._build();
        this._built = true;
      }
    }

    disconnectedCallback() {
      // ページから外されたら止めます。外れた要素の動画は、見えなくても音が鳴り続けるためです。
      if (this._video) this._video.pause();
      clearTimeout(this._idleTimer);
      clearTimeout(this._skipTimer);
    }

    attributeChangedCallback(name) {
      const video = this._video;
      if (name === "color") {
        // 色は <video> が無くても(組み立て前でも)反映できるので、先に扱います。
        this._applyColor();
      } else if (!video) {
        // まだ組み立て前。ほかの属性は組み立てるときにまとめて写します。
      } else if (name === "src") {
        video.src = this.getAttribute("src") || "";
        this.removeAttribute("data-error");
        // 形は動画ごとに覚えているので、選び直しを読み込み、画素数も測り直します。
        this._pixelRatio = 0;
        this._pixelSize = "";
        this._loadAspect();
      } else if (name === "aspect") {
        this._loadAspect();
      } else if (name === "poster") {
        video.poster = this.getAttribute("poster") || "";
      } else if (name === "loop") {
        video.loop = this.hasAttribute("loop");
        this._renderMenu();
      } else if (name === "muted") {
        video.muted = this.hasAttribute("muted");
      }
    }

    /**
     * color 属性を --p-video-accent として要素に付けます。属性を外したら付けた値も外し、
     * 置く側の CSS(または既定の色)へ戻します。
     * 【色の確かめは CSS.supports に任せること】自前の正規表現で判定すると、hsl() や color-mix() など
     * 正しい書き方を弾いたり、壊れた値を通したりします。
     */
    _applyColor() {
      const color = (this.getAttribute("color") || "").trim();
      const valid = color !== "" && typeof CSS !== "undefined" && CSS.supports("color", color);

      if (valid) {
        this.style.setProperty("--p-video-accent", color);
      } else {
        this.style.removeProperty("--p-video-accent");
        if (color !== "") console.warn('<p-video> color="' + color + '" は色として読めないため、既定の色を使います。');
      }
    }

    /**
     * 映像の形の選択を読み込みます。見る人が覚えさせたもの → aspect 属性 → "auto" の順です。
     * 【localStorage は try で囲むこと】プライベートウィンドウなどでは読むだけで例外になり、
     *  プレイヤーごと止まってしまいます。読めなければ覚えていないのと同じに扱います。
     */
    _loadAspect() {
      let saved = null;
      try {
        saved = window.localStorage.getItem(ASPECT_STORE + (this.getAttribute("src") || ""));
      } catch (error) {
        saved = null;
      }
      const text = (saved !== null) ? saved : (this.getAttribute("aspect") || "auto").trim();

      if (text === "auto" || text === "") {
        this._aspectChoice = "auto";
      } else if (text === "pixel") {
        this._aspectChoice = "pixel";
      } else if (parseRatio(text) > 0) {
        this._aspectChoice = parseRatio(text);
      } else {
        this._aspectChoice = "auto";
        console.warn('<p-video> aspect="' + text + '" は比率として読めないため、ファイルどおりに映します。');
      }
      this._applyAspect();
      if (this._els && this._els.menu.classList.contains("open")) this._renderMenu();
    }

    /**
     * 見る人が選んだ形を、この動画の分として覚えます。覚えられなくても今の表示は変えます。
     */
    _chooseAspect(choice) {
      this._aspectChoice = choice;
      try {
        window.localStorage.setItem(ASPECT_STORE + (this.getAttribute("src") || ""), String(choice));
      } catch (error) {
        // 覚えられないだけで、表示はこのまま切り替えます。
      }
      this._applyAspect();
    }

    /**
     * 実際に出てきた映像の画素数を測ります(最初の1コマが出たとき)。
     * 【videoWidth / videoHeight を使わないこと】あれはファイルに書かれた表示用の大きさで、
     *  狂っているのはまさにそこです。VideoFrame の visibleRect は画素の並びそのものです。
     * VideoFrame が無い・作れない(古いブラウザなど)ときは 0 のままにし、「画素どおり」を出しません。
     */
    _measurePixels() {
      this._pixelRatio = 0;
      this._pixelSize = "";
      if (typeof VideoFrame !== "function") return;
      try {
        const frame = new VideoFrame(this._video);
        const rect = frame.visibleRect;
        const width = rect ? rect.width : frame.codedWidth;
        const height = rect ? rect.height : frame.codedHeight;
        frame.close();
        if (width > 0 && height > 0) {
          this._pixelRatio = width / height;
          this._pixelSize = width + "×" + height;
        } else {
          this._pixelRatio = 0;
          this._pixelSize = "";
        }
      } catch (error) {
        this._pixelRatio = 0;
        this._pixelSize = "";
      }
    }

    /**
     * 選ばれた形を表示へ写します。比率が決まらないとき(auto、または画素数がまだ分からない pixel)は
     * data-aspect を外し、ふだんの contain(ファイルどおり)で映します。
     */
    _applyAspect() {
      let ratio = 0;
      if (this._aspectChoice === "auto") {
        ratio = 0;
      } else if (this._aspectChoice === "pixel") {
        ratio = this._pixelRatio;
      } else {
        ratio = this._aspectChoice;
      }

      if (ratio > 0) {
        this.style.setProperty("--p-video-picture", String(ratio));
        this.setAttribute("data-aspect", "");
      } else {
        this.style.removeProperty("--p-video-picture");
        this.removeAttribute("data-aspect");
      }
    }

    // ---- 外から使う操作(<video> と同じ名前) ----
    play() { return this._video ? this._video.play() : Promise.resolve(); }
    pause() { if (this._video) this._video.pause(); }
    get paused() { return this._video ? this._video.paused : true; }
    get currentTime() { return this._video ? this._video.currentTime : 0; }
    set currentTime(value) { if (this._video) this._video.currentTime = value; }
    get duration() { return this._video ? this._video.duration : NaN; }
    get video() { return this._video || null; }

    /**
     * 表示する言語("ja" / "en")。見る人が選んでいればそれ、"auto" なら近い祖先の lang で決めます。
     */
    _language() {
      let code;
      if (this._lang === "ja" || this._lang === "en") {
        code = this._lang;
      } else {
        const holder = this.closest("[lang]");
        const lang = ((holder && holder.getAttribute("lang")) || "").toLowerCase();
        code = (lang.indexOf("ja") === 0) ? "ja" : "en";
      }
      return code;
    }

    _t(key) {
      const table = PVideo.labels[this._language()] || PVideo.labels.en;
      return table[key] || LABELS.en[key] || key;
    }

    /**
     * 見る人が選んだ言語を読み込みます。読めない・覚えていないときは "auto" です。
     * 【localStorage は try で囲むこと】(_loadAspect と同じ理由)
     */
    _loadLanguage() {
      let saved = null;
      try {
        saved = window.localStorage.getItem(LANG_STORE);
      } catch (error) {
        saved = null;
      }
      this._lang = (saved === "ja" || saved === "en") ? saved : "auto";
    }

    /**
     * 言語を選び直します。すべてのプレイヤーで共通に覚え、このプレイヤーの言葉を書き換えます。
     * ほかのプレイヤーは次に読み込んだときから選んだ言語になります。
     */
    _chooseLanguage(lang) {
      this._lang = lang;
      try {
        if (lang === "auto") {
          window.localStorage.removeItem(LANG_STORE);
        } else {
          window.localStorage.setItem(LANG_STORE, lang);
        }
      } catch (error) {
        // 覚えられないだけで、このプレイヤーの表示は切り替えます。
      }
      this._renderLabels();
      this._renderState();
    }

    /**
     * 状態で変わらない言葉(お知らせ・つまみの名前・ボタンの名前)を、今の言語で書き込みます。
     * 状態で変わるもの(再生/一時停止など)は _renderState が書きます。
     * 【言葉を足したら、組み立て時ではなくここで書くこと】言語を切り替えても古い言葉のまま残ります。
     */
    _renderLabels() {
      const els = this._els;
      if (this._ownLabel) this.setAttribute("aria-label", this._t("player"));
      this._root.querySelector(".notice.pip").textContent = this._t("pipActive");
      this._root.querySelector(".notice.error").textContent = this._t("error");
      els.seek.setAttribute("aria-label", this._t("seek"));
      els.volume.setAttribute("aria-label", this._t("volume"));
      this._setButton(els.center, "play", this._t("play"));
      this._setButton(els.settings, "settings", this._t("settings"));
      this._setButton(els.pip, "pip", this._t("pip"));
    }

    _build() {
      const root = this.attachShadow({ mode: "open" });
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      // 置く側が aria-label を書いていなければこちらで書き、言語を変えたときも書き換えます。
      // 置く側が書いたものは書き換えません。
      this._ownLabel = !this.hasAttribute("aria-label");
      this._loadLanguage();

      root.innerHTML =
        "<style>" + STYLE + "</style>" +
        '<div class="stage">' +
          "<video playsinline></video>" +
          '<div class="spinner"></div>' +
          '<div class="notice pip"></div>' +
          '<div class="notice error"></div>' +
          '<div class="skip back" aria-hidden="true"></div>' +
          '<div class="skip forward" aria-hidden="true"></div>' +
          '<button class="center" type="button"></button>' +
          '<div class="bar">' +
            '<div class="seek" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
              '<div class="track"><div class="buffered"></div><div class="played"></div><div class="thumb"></div></div>' +
            "</div>" +
            '<div class="row">' +
              '<button class="btn play" type="button"></button>' +
              '<div class="volume"><button class="btn mute" type="button"></button><input type="range" min="0" max="1" step="0.05"></div>' +
              '<span class="time">0:00 / 0:00</span>' +
              '<span class="spacer"></span>' +
              '<button class="btn settings" type="button" aria-haspopup="true" aria-expanded="false"></button>' +
              '<button class="btn pip" type="button"></button>' +
              '<button class="btn fs" type="button"></button>' +
            "</div>" +
          "</div>" +
          '<div class="menu" role="menu"></div>' +
        "</div>";

      const $ = (selector) => root.querySelector(selector);
      const video = $("video");
      this._root = root;
      this._video = video;
      this._els = {
        center: $(".center"), play: $(".play"), mute: $(".mute"), volume: $(".volume input"),
        time: $(".time"), seek: $(".seek"), played: $(".played"), buffered: $(".buffered"), thumb: $(".thumb"),
        settings: $(".settings"), pip: $(".btn.pip"), fs: $(".fs"), menu: $(".menu"), bar: $(".bar"),
        skipBack: $(".skip.back"), skipForward: $(".skip.forward")
      };
      const els = this._els;

      this._renderLabels();
      els.pip.hidden = !this._pipSupported();

      // 属性を <video> へ写します。
      // 標準のダウンロードボタンは出しません(以前の canvas 版と同じ程度の抑止)。
      // 右クリックの「動画を保存」は、PiP ボタンを出せるブラウザでだけ止めます(_bindVideo を参照)。
      video.preload = this.getAttribute("preload") || "metadata";
      video.poster = this.getAttribute("poster") || "";
      video.loop = this.hasAttribute("loop");
      video.muted = this.hasAttribute("muted");
      video.autoplay = this.hasAttribute("autoplay");
      video.setAttribute("controlslist", "nodownload");
      video.src = this.getAttribute("src") || "";
      this._applyColor();
      this._loadAspect();

      this._bindVideo();
      this._bindControls();
      this._bindSeek();
      this._bindKeys();
      this._renderState();
      this._renderTime();
    }

    _setButton(button, icon, label) {
      if (button.dataset.icon !== icon) {
        button.innerHTML = ICONS[icon];
        button.dataset.icon = icon;
      }
      button.setAttribute("aria-label", label);
      button.title = label;
    }

    _bindVideo() {
      const video = this._video;
      const state = () => this._renderState();
      const time = () => this._renderTime();

      video.addEventListener("loadedmetadata", time);
      // 最初の1コマが出たら画素数を測ります。メタデータの時点ではまだコマが無く測れません。
      video.addEventListener("loadeddata", () => {
        this._measurePixels();
        this._applyAspect();
        if (this._els.menu.classList.contains("open")) this._renderMenu();
      });
      ["play", "pause", "ended", "volumechange", "ratechange"].forEach((type) => video.addEventListener(type, state));
      ["timeupdate", "progress", "durationchange", "seeked"].forEach((type) => video.addEventListener(type, time));
      video.addEventListener("waiting", () => this.setAttribute("data-waiting", ""));
      ["playing", "canplay", "pause", "error"].forEach((type) => video.addEventListener(type, () => this.removeAttribute("data-waiting")));
      video.addEventListener("error", () => this.setAttribute("data-error", ""));
      video.addEventListener("loadstart", () => this.removeAttribute("data-error"));
      video.addEventListener("enterpictureinpicture", () => this.setAttribute("data-pip", ""));
      video.addEventListener("leavepictureinpicture", () => this.removeAttribute("data-pip"));
      // Safari の旧方式は出入りとも webkitpresentationmodechanged の1つで知らせます。
      video.addEventListener("webkitpresentationmodechanged", () => {
        this.toggleAttribute("data-pip", video.webkitPresentationMode === "picture-in-picture");
      });
      // 右クリックのメニューは、PiP ボタンを出せるブラウザでだけ止めます。
      // 【PiP ボタンを出せないブラウザでは止めないこと】Firefox は PiP をページから呼ぶ仕組みが無く、
      //  標準のメニューの「ピクチャーインピクチャー」が唯一の入り口です。止めると PiP を使う手段が無くなります。
      //  そのブラウザでは「動画を保存」も出ますが、URL は通信を見れば分かるので、ここの抑止はもともと
      //  手軽な保存を減らす程度のものです。迷ったら PiP を使えることの方を優先してください。
      if (this._pipSupported()) {
        video.addEventListener("contextmenu", (event) => event.preventDefault());
      }
      // 情報の画面を開いているあいだは、通信や読み込みの出来事のたびに数字を書き換えます。
      // 【この登録は上の data-waiting・data-error の付け外しより後に置くこと】同じ出来事では登録順に
      //  呼ばれるため、先に置くと付け外しの前の状態を書いてしまい、表示が1つ遅れます。
      ["loadstart", "loadedmetadata", "loadeddata", "progress", "suspend", "stalled", "waiting", "playing", "canplay",
        "canplaythrough", "emptied", "error", "abort", "timeupdate", "durationchange"].forEach((type) => {
        video.addEventListener(type, () => this._renderInfo());
      });
    }

    _bindControls() {
      const video = this._video;
      const els = this._els;
      const menuOpen = () => els.menu.classList.contains("open");

      els.center.addEventListener("click", () => this._toggle());
      els.play.addEventListener("click", () => this._toggle());
      // 動画の上の押下は .stage で受けます。映像の形を選ぶと <video> が枠より小さくなり、帯の上の
      // 押下が <video> に届かないためです。ボタンや操作バーの上の押下はここでは扱いません。
      const stage = this._root.querySelector(".stage");
      const onVideo = (target) => target === video || target === stage;
      // 押し始めが動画の上だったか。click は「押し始めも離した所も動画の上」のときだけ動画の操作にします。
      // 【click の対象だけで判断しないこと】click の対象は押した要素と離した要素の共通の祖先になるため、
      //  シークバーや音量のつまみを動かして動画の上で離すと .stage が対象になり、再生中に一時停止していました。
      // 【隠れた操作バーの場所を押したときも動画の操作にしないこと】隠れたバーは押下を通すので押し始めは
      //  <video> ですが、押した瞬間にバーが出て離すのはボタンの上になり、同じく .stage が対象になります。
      //  見る人はバーを操作するつもりなので、この押下はバーを出すだけにします。
      // 迷ったら「動画の操作にしない」側へ倒すこと。取りこぼしは押し直せば済みますが、勝手に止まるのは困るためです。
      // (この判断は操作バーを出す処理より先に行う必要があります。.stage の受け取りは要素そのものの受け取りより先なので、
      //  ここで見る data-idle はまだ押す前の状態です。)
      this._pressOnVideo = false;
      stage.addEventListener("pointerdown", (event) => {
        const bar = els.bar.getBoundingClientRect();
        const onHiddenBar = this.hasAttribute("data-idle") && event.clientY >= bar.top && event.clientY <= bar.bottom
          && event.clientX >= bar.left && event.clientX <= bar.right;
        this._pressOnVideo = onVideo(event.target) && !onHiddenBar;
      });
      stage.addEventListener("click", (event) => {
        const pressed = this._pressOnVideo;
        this._pressOnVideo = false;
        if (!onVideo(event.target) || !pressed) {
          // ボタン・操作バー・メニューの上、または押し始めがそこだった。それぞれの操作に任せます。
        } else if (menuOpen()) {
          this._closeMenu();
        } else {
          this._tapVideo(event.clientX);
        }
      });

      els.mute.addEventListener("click", () => {
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 0.5;
      });
      els.volume.addEventListener("input", () => {
        video.volume = Number(els.volume.value);
        video.muted = (video.volume === 0);
      });

      els.fs.addEventListener("click", () => this._toggleFullscreen());
      document.addEventListener("fullscreenchange", () => this._renderState());
      document.addEventListener("webkitfullscreenchange", () => this._renderState());

      els.pip.addEventListener("click", () => this._togglePip());

      els.settings.addEventListener("click", (event) => {
        event.stopPropagation();
        if (menuOpen()) {
          this._closeMenu();
        } else {
          this._menuView = "main";
          this._renderMenu();
          els.menu.classList.add("open");
          els.settings.setAttribute("aria-expanded", "true");
          this._focusMenu();
          this._wake();
        }
      });
      els.menu.addEventListener("click", (event) => {
        event.stopPropagation();
        const button = event.target.closest("button");
        const action = button ? button.dataset.action : "";
        if (action === "speed-menu") {
          this._menuView = "speed";
        } else if (action === "aspect-menu") {
          this._menuView = "aspect";
        } else if (action === "aspect") {
          const value = button.dataset.value;
          this._chooseAspect((value === "auto" || value === "pixel") ? value : Number(value));
        } else if (action === "back") {
          this._menuView = "main";
        } else if (action === "speed") {
          video.playbackRate = Number(button.dataset.value);
          this._menuView = "main";
        } else if (action === "loop") {
          video.loop = !video.loop;
        } else if (action === "lang-menu") {
          this._menuView = "lang";
        } else if (action === "lang") {
          this._chooseLanguage(button.dataset.value);
          this._menuView = "main";
        } else if (action === "info-menu") {
          this._menuView = "info";
        } else if (action === "copy-info") {
          this._copyInfo(button);
        }
        // コピーは押したボタンに「コピーしました」を出すので、描き直しません。
        if (action !== "" && action !== "copy-info") {
          this._renderMenu();
          this._focusMenu();
        }
      });
      // 「細かく合わせる」のつまみ。動かしている間はメニューを描き直さず、数字と印だけ書き換えます。
      // 【ここで _renderMenu を呼ばないこと】つまみごと作り直され、つかんでいる途中で離れてしまいます。
      els.menu.addEventListener("input", (event) => {
        if (!event.target.matches(".fine input")) return;
        const ratio = Math.pow(2, Number(event.target.value));
        this._chooseAspect(ratio);
        els.menu.querySelector(".fine .value").textContent = formatRatio(ratio);
        Array.prototype.forEach.call(els.menu.querySelectorAll('[data-action="aspect"]'), (button) => {
          button.setAttribute("aria-checked", "false");
        });
      });
      this._root.addEventListener("click", (event) => {
        if (menuOpen() && !els.menu.contains(event.target)) this._closeMenu();
      });

      // 再生中に操作が止まったら、操作バーとカーソルを隠します。
      ["pointermove", "pointerdown", "focusin", "keydown"].forEach((type) => this.addEventListener(type, () => this._wake()));
      this.addEventListener("pointerleave", () => this._sleep());
    }

    _bindSeek() {
      const video = this._video;
      const seek = this._els.seek;
      const ratioAt = (clientX) => {
        const rect = seek.getBoundingClientRect();
        return (rect.width > 0) ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
      };
      const jump = (ratio) => {
        if (Number.isFinite(video.duration)) {
          video.currentTime = ratio * video.duration;
          this._renderTime();
        }
      };
      const end = () => seek.classList.remove("dragging");

      seek.addEventListener("pointerdown", (event) => {
        seek.classList.add("dragging");
        seek.setPointerCapture(event.pointerId);
        jump(ratioAt(event.clientX));
      });
      seek.addEventListener("pointermove", (event) => {
        if (seek.classList.contains("dragging")) jump(ratioAt(event.clientX));
      });
      seek.addEventListener("pointerup", end);
      seek.addEventListener("pointercancel", end);
      seek.addEventListener("keydown", (event) => {
        if (event.key === "Home" || event.key === "End") {
          jump(event.key === "Home" ? 0 : 1);
          event.preventDefault();
          event.stopPropagation();
        }
      });
    }

    _bindKeys() {
      const video = this._video;
      this.addEventListener("keydown", (event) => {
        // ボタンの上の Enter・Space はボタンの操作に、音量のつまみの上の矢印はつまみに任せます。
        const inner = this._root.activeElement;
        const onButton = !!inner && inner.tagName === "BUTTON";
        const onRange = !!inner && inner.tagName === "INPUT";
        const key = event.key.toLowerCase();
        let handled = true;

        if ((key === " " && !onButton) || key === "k") {
          this._toggle();
        } else if (key === "arrowleft" && !onRange) {
          video.currentTime = Math.max(0, video.currentTime - 5);
        } else if (key === "arrowright" && !onRange) {
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
        } else if (key === "arrowup" && !onRange) {
          video.muted = false;
          video.volume = Math.min(1, video.volume + 0.1);
        } else if (key === "arrowdown" && !onRange) {
          video.volume = Math.max(0, video.volume - 0.1);
        } else if (key === "m") {
          video.muted = !video.muted;
        } else if (key === "f") {
          this._toggleFullscreen();
        } else if (key === "escape" && this._els.menu.classList.contains("open")) {
          this._closeMenu();
          this._els.settings.focus();
        } else {
          handled = false;
        }

        if (handled) event.preventDefault();
      });
    }

    _toggle() {
      const video = this._video;
      if (video.paused || video.ended) {
        Promise.resolve(video.play()).catch(() => {});
      } else {
        video.pause();
      }
    }

    /**
     * 動画の上のクリック(タップ)。DOUBLE_MS 以内に同じ場所が続けて押されたら「続けて押した」とみなし、
     *   左の 1/3 … SKIP_SECONDS 秒戻る(押し続ける限り重ねて戻る)
     *   右の 1/3 … SKIP_SECONDS 秒進む(同上)
     *   まん中   … 全画面の切り替え(2回目だけ。3回目は新しい1回目として扱う)
     * 1回目は待たずに再生/一時停止を切り替え、2回目でその切り替えを取り消します。
     * 【dblclick イベントに戻さないこと】スマホのブラウザにはダブルタップで dblclick を出さないものがあり、
     *  戻る・進むが効かなくなります。3回目以降も数えられず、続けて重ねて戻ることができません。
     * 【1回目を DOUBLE_MS 待ってから再生/一時停止する形にしないこと】1回押すたびに反応が遅れます。
     *  2回目の取り消しで一瞬止まって見えるのは、その遅れより小さい代償として受け入れています。
     * 【場所が変わったら数え直すこと】左→右と素早く押したとき、戻ってすぐ進むような動きになるためです。
     */
    _tapVideo(clientX) {
      // 左右の 1/3 は枠で測ります(映像の形を選ぶと <video> の箱は枠より小さくなるため)。
      const rect = this._root.querySelector(".stage").getBoundingClientRect();
      const x = (rect.width > 0) ? (clientX - rect.left) / rect.width : 0.5;
      const now = Date.now();
      const last = this._tap;
      let zone;
      if (x < 1 / 3) {
        zone = "back";
      } else if (x > 2 / 3) {
        zone = "forward";
      } else {
        zone = "middle";
      }
      const repeated = !!last && last.zone === zone && (now - last.time) <= DOUBLE_MS;
      const count = repeated ? last.count + 1 : 1;

      if (count === 1) {
        this._toggle();
        this._tap = { zone: zone, time: now, count: count };
      } else if (zone === "middle") {
        this._toggle();
        this._toggleFullscreen();
        this._tap = null;
      } else {
        if (count === 2) this._toggle();
        this._skip(zone === "back" ? -SKIP_SECONDS : SKIP_SECONDS, (count - 1) * SKIP_SECONDS);
        this._tap = { zone: zone, time: now, count: count };
      }
    }

    /**
     * delta 秒だけ動かし、押した側に「ここまでで total 秒動いた」印を出します。
     * 長さがまだ分からない(読み込み前)ときは動かしません。先へ進むと 0 秒へ飛んでしまうためです。
     */
    _skip(delta, total) {
      const video = this._video;
      const els = this._els;
      if (!Number.isFinite(video.duration)) return;

      video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + delta));
      this._renderTime();

      const amount = this._t("seconds").replace("{n}", String(total));
      const badge = (delta < 0) ? els.skipBack : els.skipForward;
      const other = (delta < 0) ? els.skipForward : els.skipBack;
      badge.textContent = (delta < 0) ? "« " + amount : amount + " »";
      badge.classList.add("show");
      other.classList.remove("show");
      clearTimeout(this._skipTimer);
      this._skipTimer = setTimeout(() => badge.classList.remove("show"), SKIP_BADGE_MS);
    }

    /**
     * PiP が使えるか。標準の方式(Chrome・Edge・新しい Safari)か、Safari の旧方式のどちらかがあれば使えます。
     * どちらも無いブラウザ(Firefox など)ではボタンを出しません。押しても何も起きないボタンになるためです。
     * 【pictureInPictureEnabled が false のときは標準の方式を使えないと扱うこと】iframe の allow で
     *  止められているときなどで、requestPictureInPicture を呼んでも必ず失敗します。
     */
    _pipSupported() {
      const video = this._video;
      const standard = !!document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function";
      const webkit = typeof video.webkitSetPresentationMode === "function" && typeof video.webkitSupportsPresentationMode === "function"
        && video.webkitSupportsPresentationMode("picture-in-picture");
      return standard || webkit;
    }

    _togglePip() {
      const video = this._video;
      if (document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function") {
        const request = (document.pictureInPictureElement === video) ? document.exitPictureInPicture() : video.requestPictureInPicture();
        Promise.resolve(request).catch(() => {});
      } else if (typeof video.webkitSetPresentationMode === "function") {
        video.webkitSetPresentationMode(video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture");
      } else {
        // _pipSupported が false ならボタンは出ていないので、ここへは来ません。
      }
    }

    _isFullscreen() {
      return (document.fullscreenElement || document.webkitFullscreenElement || null) === this;
    }

    _toggleFullscreen() {
      const video = this._video;
      if (this._isFullscreen()) {
        Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen).call(document)).catch(() => {});
      } else if (this.requestFullscreen) {
        Promise.resolve(this.requestFullscreen()).catch(() => {});
      } else if (this.webkitRequestFullscreen) {
        this.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        // iPhone の Safari は要素の全画面ができないので、動画だけの全画面にします。
        video.webkitEnterFullscreen();
      }
    }

    _focusMenu() {
      const first = this._els.menu.querySelector("button");
      if (first) first.focus();
    }

    _closeMenu() {
      this._els.menu.classList.remove("open");
      this._els.settings.setAttribute("aria-expanded", "false");
      this._wake();
    }

    _renderMenu() {
      const video = this._video;
      if (!video) return;
      const speedLabel = (rate) => (rate === 1 ? this._t("normal") : rate + "x");
      const item = (action, label, value, extra) =>
        '<button type="button" data-action="' + action + '" ' + (extra || 'role="menuitem"') + ">" +
        '<span class="label">' + label + "</span>" + (value === "" ? "" : '<span class="value">' + value + "</span>") + "</button>";

      const choice = this._aspectChoice;
      const fileRatio = (video.videoWidth > 0 && video.videoHeight > 0) ? video.videoWidth / video.videoHeight : 0;
      const aspectItem = (value, label, ratio, checked) =>
        item("aspect", label, ratio > 0 ? formatRatio(ratio) : "", 'role="menuitemradio" data-value="' + value + '" aria-checked="' + checked + '"');
      let aspectLabel;
      if (choice === "auto") {
        aspectLabel = this._t("aspectAuto");
      } else if (choice === "pixel") {
        aspectLabel = this._t("aspectPixel");
      } else {
        aspectLabel = formatRatio(choice);
      }

      if (this._menuView === "speed") {
        this._els.menu.innerHTML = item("back", "‹ " + this._t("speed"), "") + SPEEDS.map((rate) =>
          item("speed", speedLabel(rate), "", 'role="menuitemradio" data-value="' + rate + '" aria-checked="' + (video.playbackRate === rate) + '"')
        ).join("");
      } else if (this._menuView === "aspect") {
        // つまみの位置は、今の比率(決まっていなければファイルの比率、それも無ければ 1:1)から決めます。
        let current;
        if (typeof choice === "number") {
          current = choice;
        } else if (choice === "pixel" && this._pixelRatio > 0) {
          current = this._pixelRatio;
        } else if (fileRatio > 0) {
          current = fileRatio;
        } else {
          current = 1;
        }
        const fineValue = Math.min(FINE_RANGE, Math.max(-FINE_RANGE, Math.log2(current)));
        this._els.menu.innerHTML =
          item("back", "‹ " + this._t("aspect"), "") +
          aspectItem("auto", this._t("aspectAuto"), fileRatio, choice === "auto") +
          (this._pixelRatio > 0 ? aspectItem("pixel", this._t("aspectPixel"), this._pixelRatio, choice === "pixel") : "") +
          ASPECTS.map((entry) =>
            aspectItem(String(entry[1]), entry[0], 0, typeof choice === "number" && Math.abs(entry[1] - choice) / choice < 0.01)
          ).join("") +
          '<div class="fine"><span class="head"><span class="label">' + this._t("aspectFine") + "</span>" +
          '<span class="value">' + formatRatio(current) + "</span></span>" +
          '<input type="range" min="' + (-FINE_RANGE) + '" max="' + FINE_RANGE + '" step="0.01" value="' + fineValue.toFixed(2) + '"' +
          ' aria-label="' + this._t("aspectFine") + '"></div>';
      } else if (this._menuView === "lang") {
        // 言語の名前は、どの言語で表示していてもその言語自身の書き方で出します(読めない言語に迷い込まないため)。
        this._els.menu.innerHTML =
          item("back", "‹ " + this._t("language"), "") +
          [["auto", this._t("auto")], ["ja", "日本語"], ["en", "English"]].map((entry) =>
            item("lang", entry[1], "", 'role="menuitemradio" data-value="' + entry[0] + '" aria-checked="' + (this._lang === entry[0]) + '"')
          ).join("");
      } else if (this._menuView === "info") {
        // 値は _renderInfo が textContent で入れます(出来事のたびに描き直さず、そこだけ書き換えるため)。
        this._els.menu.innerHTML =
          item("back", "‹ " + this._t("info"), "") +
          this._infoRows().map((row) =>
            '<div class="inforow"><span class="label">' + row[1] + '</span><span class="value" data-info="' + row[0] + '"></span></div>'
          ).join("") +
          '<a class="home" href="' + HOMEPAGE + '" target="_blank" rel="noopener">' + HOMEPAGE.replace("https://", "") + "</a>" +
          (navigator.clipboard ? item("copy-info", this._t("copyInfo"), "") : "");
        this._renderInfo();
      } else {
        let langLabel;
        if (this._lang === "ja") {
          langLabel = "日本語";
        } else if (this._lang === "en") {
          langLabel = "English";
        } else {
          langLabel = this._t("auto");
        }
        this._els.menu.innerHTML =
          item("speed-menu", this._t("speed"), speedLabel(video.playbackRate) + " ›") +
          item("aspect-menu", this._t("aspect"), aspectLabel + " ›") +
          item("loop", this._t("loop"), video.loop ? this._t("on") : this._t("off"), 'role="menuitemcheckbox" aria-checked="' + video.loop + '"') +
          item("lang-menu", this._t("language"), langLabel + " ›") +
          item("info-menu", this._t("info"), "v" + VERSION + " ›");
      }
    }

    /**
     * 情報の画面の行を [鍵, 名前, 値] で返します。画面の表示とコピーの両方がこれを使います。
     * 【行を足すときはここだけ足すこと】表示とコピーで中身が食い違わないようにするためです。
     */
    _infoRows() {
      const video = this._video;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;

      let network;
      if (this.hasAttribute("data-error") && video.error) {
        const code = video.error.code;
        if (code === 1) {
          network = this._t("errAborted");
        } else if (code === 2) {
          network = this._t("errNetwork");
        } else if (code === 3) {
          network = this._t("errDecode");
        } else {
          network = this._t("errSource");
        }
      } else if (this.hasAttribute("data-waiting")) {
        network = this._t("netWaiting");
      } else if (video.networkState === 0) {
        network = this._t("netEmpty");
      } else if (video.networkState === 1) {
        network = this._t("netIdle");
      } else if (video.networkState === 2) {
        network = this._t("netLoading");
      } else {
        network = this._t("netNoSource");
      }

      // 読み込み済みは、全体に対する割合と、今の位置から先にどれだけあるか。
      let bufferedTotal = 0;
      let ahead = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i);
        const end = video.buffered.end(i);
        bufferedTotal += end - start;
        if (start <= video.currentTime && video.currentTime <= end) ahead = end - video.currentTime;
      }
      const buffered = (duration > 0)
        ? Math.min(100, Math.round(bufferedTotal / duration * 100)) + "% · " + this._t("ahead").replace("{n}", String(Math.round(ahead)))
        : this._t("unknown");

      const fileSize = (video.videoWidth > 0 && video.videoHeight > 0)
        ? video.videoWidth + "×" + video.videoHeight + " (" + formatRatio(video.videoWidth / video.videoHeight) + ")"
        : this._t("unknown");
      const pixelSize = (this._pixelSize !== "")
        ? this._pixelSize + " (" + formatRatio(this._pixelRatio) + ")"
        : this._t("unknown");

      let frames;
      if (typeof video.getVideoPlaybackQuality === "function") {
        const quality = video.getVideoPlaybackQuality();
        frames = quality.droppedVideoFrames + " / " + quality.totalVideoFrames;
      } else {
        frames = this._t("unknown");
      }

      return [
        ["version", this._t("version"), "p-video " + VERSION],
        ["copyright", this._t("copyright"), COPYRIGHT + " · " + LICENSE],
        ["network", this._t("network"), network],
        ["buffered", this._t("buffered"), buffered],
        ["ready", this._t("ready"), this._t("ready" + video.readyState)],
        ["fileSize", this._t("fileSize"), fileSize],
        ["pixelSize", this._t("pixelSize"), pixelSize],
        ["frames", this._t("frames"), frames]
      ];
    }

    /**
     * 情報の画面を開いていれば、値だけ書き換えます。開いていなければ何もしません
     * (timeupdate のたびに呼ばれるので、閉じているときに計算しないため)。
     */
    _renderInfo() {
      const menu = this._els.menu;
      if (this._menuView !== "info" || !menu.classList.contains("open")) return;
      this._infoRows().forEach((row) => {
        const cell = menu.querySelector('[data-info="' + row[0] + '"]');
        if (cell) cell.textContent = row[2];
      });
    }

    /**
     * 情報を「名前: 値」の行にしてコピーし、押したボタンに結果を出します。
     * コピーできなかったとき(権限が無いなど)は、ボタンの表示を変えないだけにします。
     */
    _copyInfo(button) {
      const text = this._infoRows().map((row) => row[1] + ": " + row[2]).join("\n");
      Promise.resolve(navigator.clipboard.writeText(text)).then(() => {
        const label = button.querySelector(".label");
        if (label) label.textContent = this._t("copied");
      }).catch(() => {});
    }

    _renderState() {
      const video = this._video;
      const els = this._els;
      const playing = !video.paused && !video.ended;
      const fullscreen = this._isFullscreen();
      const quiet = video.muted || video.volume === 0;

      this.toggleAttribute("data-playing", playing);
      this.toggleAttribute("data-fullscreen", fullscreen);
      this._setButton(els.play, playing ? "pause" : "play", playing ? this._t("pause") : this._t("play"));
      this._setButton(els.mute, quiet ? "muted" : "volume", quiet ? this._t("unmute") : this._t("mute"));
      this._setButton(els.fs, fullscreen ? "exitFullscreen" : "fullscreen", fullscreen ? this._t("exitFullscreen") : this._t("fullscreen"));
      if (this._root.activeElement !== els.volume) {
        els.volume.value = String(quiet ? 0 : video.volume);
      }
      if (els.menu.classList.contains("open")) this._renderMenu();

      if (playing) {
        this._wake();
      } else {
        clearTimeout(this._idleTimer);
        this.removeAttribute("data-idle");
      }
    }

    _renderTime() {
      const video = this._video;
      const els = this._els;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const ratio = (duration > 0) ? Math.min(1, video.currentTime / duration) : 0;
      let buffered = 0;

      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime) buffered = video.buffered.end(i);
      }

      els.played.style.width = (ratio * 100) + "%";
      els.thumb.style.left = (ratio * 100) + "%";
      els.buffered.style.width = (duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0) + "%";
      els.time.textContent = formatTime(video.currentTime) + " / " + formatTime(duration);
      els.seek.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      els.seek.setAttribute("aria-valuetext", formatTime(video.currentTime));
    }

    _wake() {
      this.removeAttribute("data-idle");
      clearTimeout(this._idleTimer);
      if (this._video && !this._video.paused && !this._els.menu.classList.contains("open")) {
        this._idleTimer = setTimeout(() => this._sleep(), IDLE_MS);
      }
    }

    _sleep() {
      if (this._video && !this._video.paused && !this._els.menu.classList.contains("open")) {
        this.setAttribute("data-idle", "");
      }
    }
  }

  PVideo.labels = LABELS;
  window.PVideo = PVideo;
  window.customElements.define("p-video", PVideo);
})();
