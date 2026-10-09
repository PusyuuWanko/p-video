# p-video.js

**依存なし・1ファイルで動く、YouTube 風の動画プレイヤー(Web Components)。**

> **English summary**
> A dependency-free, single-file video player built as a Web Component (`<p-video>`).
> Drop in one `<script>` and write `<p-video src="movie.mp4">`. The player keeps a fixed
> 16:9 frame and letterboxes any video inside it (like YouTube), so nothing is ever cropped
> or stretched. Its UI lives in a Shadow DOM, so your page's CSS cannot break it.
> Accent color via the `color` attribute, keyboard shortcuts, picture-in-picture,
> full screen, playback speed, loop. Japanese / English labels. MIT licensed.

## 使い方

```html
<script src="p-video.js"></script>

<p-video src="movie.mp4"></p-video>
```

これだけです。ビルドも、ほかの CSS・画像・フォントも要りません。

デモ: `demo/index.html` をブラウザで開いてください(動画を読むので、ローカルの Web サーバ経由がおすすめです)。

## 特長

- **帯で比率を保つ** — 枠はいつも決まった比率(既定 16:9)。動画は枠の中に、はみ出さず縦横比を保って映り、
  比率の違う分は黒い帯になります。縦長の動画を並べても、枠の高さがそろいます。
- **外の CSS に崩されない** — 中身は Shadow DOM の中です。ページ側で `button { ... }` のような指定をしていても、
  プレイヤーのボタンには届きません。
- **1ファイル** — アイコンも中に入っています。外部のファイルを読みに行きません。
- **操作** — 再生/一時停止、シークバー(読み込み済みの範囲も表示)、音量、再生速度、ループ、
  ピクチャーインピクチャー、全画面(iPhone では動画の全画面)。再生中に操作が止まると操作バーが隠れます。
- **プレイヤーの幅に合わせて詰める** — 画面の幅ではなく、プレイヤー自身の幅(コンテナクエリ)で操作バーを詰めます。
- **キーボード** — Space・K 再生/一時停止、← → 5秒移動、↑ ↓ 音量、M 消音、F 全画面。
- **日本語 / 英語** — 近い祖先の `lang` が `ja` なら日本語、それ以外は英語で表示します。

## 属性

| 属性 | 意味 |
|---|---|
| `src` | 動画の URL(必須)。あとから変えると読み直します |
| `poster` | 再生前に出す画像 |
| `preload` | `none` / `metadata` / `auto`(既定 `metadata`) |
| `loop` `muted` `autoplay` | `<video>` と同じ意味 |
| `color` | プレイヤーの色(既定は緑 `#22c55e`)。CSS の色ならどれでも書けます。色として読めない値は無視します |

## CSS で変えられるもの

```css
p-video {
  width: 640px;                 /* 幅だけ決めれば、高さは比率から決まります */
  --p-video-ratio: 4 / 3;       /* 枠の比率(既定 16 / 9)。動画の比率ではありません */
  --p-video-accent: #ff3d6e;    /* 色(color 属性があればそちらが優先) */
  --p-video-radius: 12px;       /* 角丸 */
  --p-video-bg: #000;           /* 帯の色 */
}
```

`height` を固定しても映像は切れませんが、枠の比率が崩れて帯の形が変わります。

## JavaScript から

```js
const player = document.querySelector("p-video");
player.play();
player.pause();
player.paused;        // true / false
player.currentTime = 30;
player.duration;
player.video;         // 中の <video> 要素
```

表示する言葉は `PVideo.labels.ja` / `PVideo.labels.en` を、要素を作る前に書き換えると変えられます。

## 対応ブラウザ

Custom Elements・Shadow DOM・`aspect-ratio`・コンテナクエリに対応したブラウザ
(Chrome / Edge 105 以降、Safari 16 以降、Firefox 110 以降)。

## ライセンス

[MIT License](LICENSE) © 2025-2026 ISAMI ABE

もとは [プシューコント](https://github.com/PusyuuWanko/p-conte) のために作ったプレイヤーです。
