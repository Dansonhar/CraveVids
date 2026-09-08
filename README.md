# CraveAsia — Video Presentations

A single-screen, black-and-white presentation of the videos in the `videos/` folder.
The page never scrolls — the device on stage does the moving.
No build step, no dependencies.

## Run it

```bash
npm start          # http://localhost:5173, opens automatically, live reload
npm run check      # lists the videos and which ones still need a description
```

## If the server stops on its own

A bare `zsh: terminated  npm run dev` means another process signalled it — not
a crash in the page or the server. The usual causes are another terminal or
tool running a broad `pkill -f "node server.js"` (which matches every such
process on the machine, not just this one), or closing the terminal window
that launched it.

The server now prints why it stopped and records its pid in `.server.pid`:

| Command | What it does |
|---|---|
| `npm stop` | Stops **only** this project's server, by pid — never anything else |
| `npm restart` | Stop, then start again |

To stop it by hand use the pid printed on startup: `kill <pid>`.
Avoid `pkill -f node` — it is far broader than it looks.

## Adding videos

1. Drop the files into `videos/` — `.mp4`, `.webm`, `.mov` or `.m4v`.
2. Reload the page. Every file shows up on its own, titled from its filename
   (`opening-reel.mp4` → "Opening Reel").
3. Descriptions are optional and live in [`videos.js`](videos.js), keyed by exact filename:

```js
const VIDEO_META = {
  "opening-reel.mp4": {
    title: "Opening Reel",
    desc:  "One or two sentences shown on the card and under the player.",
    notes: ["Short bullet", "Another short bullet"],
  },
};
```

The order in `videos.js` is the order on the page; anything not listed follows,
sorted by filename.

## Files

| | |
|---|---|
| `index.html` | Page markup |
| `styles.css` | Black & white theme |
| `app.js` | Grid, search, player |
| `videos.js` | Titles and descriptions — the only file you normally edit |
| `server.js` | Zero-dependency dev server (`/api/videos`, range requests, live reload) |
| `videos/` | The video files |

Static hosting works too, but without `/api/videos` the page can only show the
files named in `videos.js`.
