/*****************************************
  *----------------------------------
  |  ThisScriptVersion: 2.3.0     |
  |  © ISAMI ABE                  |
  |  LastUpdate: 2026-10-09       |
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

見た目の調整(置く側のCSSで指定できます):
  p-video { width: 640px; --p-video-ratio: 4 / 3; --p-video-accent: #ff3d6e; --p-video-radius: 12px; }
  --p-video-ratio … 枠の縦横比(既定 16 / 9)。動画の比率ではなく、プレイヤーの枠の比率です。

操作(要素から呼べます):
  el.play() / el.pause() / el.paused / el.currentTime / el.duration / el.video(中の <video>)

キーボード(プレイヤーにフォーカスがあるとき):
  Space・K 再生/一時停止  ← → 5秒戻る/進む  ↑ ↓ 音量  M 消音  F 全画面

表示する言葉:
  置いたページ(または近い祖先)の lang が ja で始まれば日本語、それ以外は英語です。
  変えたいときは、要素を作る前に PVideo.labels.ja.play = "..." のように差し替えてください。

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
  【動画を canvas へ描き写す作りに戻さないこと】以前はそうしていて、canvas の置き方が外のCSSや
   ずらしの指定に左右され、映像の上下が切れていました。再生中ずっと描き写す分の負荷もかかり、
   一時停止中は何も映りませんでした。

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
      error: "動画を読み込めませんでした"
    },
    en: {
      play: "Play", pause: "Pause", mute: "Mute", unmute: "Unmute", volume: "Volume",
      fullscreen: "Full screen", exitFullscreen: "Exit full screen", pip: "Picture-in-picture",
      settings: "Settings", speed: "Speed", loop: "Loop", on: "On", off: "Off", normal: "Normal",
      seek: "Seek", player: "Video player", pipActive: "Playing in picture-in-picture",
      error: "Could not load the video"
    }
  };

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  // 再生中に操作が止まってから、操作バーとカーソルを隠すまでの時間(ミリ秒)。
  const IDLE_MS = 2500;

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
       同じページに大小のプレイヤーが並んでも、それぞれに合った操作バーになります。 */
    .stage { position: absolute; inset: 0; container-type: inline-size; }
    video {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: contain; background: var(--p-video-bg); display: block;
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
      position: absolute; right: 10px; bottom: 58px; min-width: 190px; max-height: calc(100% - 70px); overflow-y: auto;
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
    @container (max-width: 280px) {
      .time, .btn.pip { display: none; }
    }
    @container (max-width: 190px) {
      .btn.mute, .btn.settings { display: none; }
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

  class PVideo extends HTMLElement {
    static get observedAttributes() {
      return ["src", "poster", "loop", "muted", "color"];
    }

    constructor() {
      super();
      this._built = false;
      this._idleTimer = 0;
      this._menuView = "main";
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

    // ---- 外から使う操作(<video> と同じ名前) ----
    play() { return this._video ? this._video.play() : Promise.resolve(); }
    pause() { if (this._video) this._video.pause(); }
    get paused() { return this._video ? this._video.paused : true; }
    get currentTime() { return this._video ? this._video.currentTime : 0; }
    set currentTime(value) { if (this._video) this._video.currentTime = value; }
    get duration() { return this._video ? this._video.duration : NaN; }
    get video() { return this._video || null; }

    _t(key) {
      const holder = this.closest("[lang]");
      const lang = ((holder && holder.getAttribute("lang")) || "").toLowerCase();
      const table = PVideo.labels[lang.indexOf("ja") === 0 ? "ja" : "en"] || PVideo.labels.en;
      return table[key] || LABELS.en[key] || key;
    }

    _build() {
      const root = this.attachShadow({ mode: "open" });
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", this._t("player"));

      root.innerHTML =
        "<style>" + STYLE + "</style>" +
        '<div class="stage">' +
          "<video playsinline></video>" +
          '<div class="spinner"></div>' +
          '<div class="notice pip"></div>' +
          '<div class="notice error"></div>' +
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
        settings: $(".settings"), pip: $(".btn.pip"), fs: $(".fs"), menu: $(".menu")
      };
      const els = this._els;

      $(".notice.pip").textContent = this._t("pipActive");
      $(".notice.error").textContent = this._t("error");
      els.seek.setAttribute("aria-label", this._t("seek"));
      els.volume.setAttribute("aria-label", this._t("volume"));
      this._setButton(els.center, "play", this._t("play"));
      this._setButton(els.settings, "settings", this._t("settings"));
      this._setButton(els.pip, "pip", this._t("pip"));
      els.pip.hidden = !(document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function");

      // 属性を <video> へ写します。
      // 右クリックの「動画を保存」と標準のダウンロードボタンは出しません(以前の canvas 版と同じ程度の抑止)。
      video.preload = this.getAttribute("preload") || "metadata";
      video.poster = this.getAttribute("poster") || "";
      video.loop = this.hasAttribute("loop");
      video.muted = this.hasAttribute("muted");
      video.autoplay = this.hasAttribute("autoplay");
      video.setAttribute("controlslist", "nodownload");
      video.src = this.getAttribute("src") || "";
      this._applyColor();

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
      ["play", "pause", "ended", "volumechange", "ratechange"].forEach((type) => video.addEventListener(type, state));
      ["timeupdate", "progress", "durationchange", "seeked"].forEach((type) => video.addEventListener(type, time));
      video.addEventListener("waiting", () => this.setAttribute("data-waiting", ""));
      ["playing", "canplay", "pause", "error"].forEach((type) => video.addEventListener(type, () => this.removeAttribute("data-waiting")));
      video.addEventListener("error", () => this.setAttribute("data-error", ""));
      video.addEventListener("loadstart", () => this.removeAttribute("data-error"));
      video.addEventListener("enterpictureinpicture", () => this.setAttribute("data-pip", ""));
      video.addEventListener("leavepictureinpicture", () => this.removeAttribute("data-pip"));
      video.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    _bindControls() {
      const video = this._video;
      const els = this._els;
      const menuOpen = () => els.menu.classList.contains("open");

      els.center.addEventListener("click", () => this._toggle());
      els.play.addEventListener("click", () => this._toggle());
      video.addEventListener("click", () => {
        if (menuOpen()) {
          this._closeMenu();
        } else {
          this._toggle();
        }
      });
      video.addEventListener("dblclick", () => this._toggleFullscreen());

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

      els.pip.addEventListener("click", () => {
        const request = (document.pictureInPictureElement === video) ? document.exitPictureInPicture() : video.requestPictureInPicture();
        Promise.resolve(request).catch(() => {});
      });

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
        } else if (action === "back") {
          this._menuView = "main";
        } else if (action === "speed") {
          video.playbackRate = Number(button.dataset.value);
          this._menuView = "main";
        } else if (action === "loop") {
          video.loop = !video.loop;
        }
        if (action !== "") {
          this._renderMenu();
          this._focusMenu();
        }
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

      if (this._menuView === "speed") {
        this._els.menu.innerHTML = item("back", "‹ " + this._t("speed"), "") + SPEEDS.map((rate) =>
          item("speed", speedLabel(rate), "", 'role="menuitemradio" data-value="' + rate + '" aria-checked="' + (video.playbackRate === rate) + '"')
        ).join("");
      } else {
        this._els.menu.innerHTML =
          item("speed-menu", this._t("speed"), speedLabel(video.playbackRate) + " ›") +
          item("loop", this._t("loop"), video.loop ? this._t("on") : this._t("off"), 'role="menuitemcheckbox" aria-checked="' + video.loop + '"');
      }
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
