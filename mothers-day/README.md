# Mother's Day Garden

A blooming sunset garden with drifting petals, butterflies, dragonflies, and your personal message.

## Customize

Edit **`js/config.js`** — change her name, your message, reasons, and signature.

## Preview locally

Must be served over HTTP (ES modules won't work from `file://`):

```bash
npx serve mothers-day
```

Open **http://localhost:3000** in your browser.

## Deploy

### GitHub Pages

1. Push the repo to GitHub
2. Settings → Pages → Source: branch `main`, folder `/mothers-day`
3. Share the published URL

### Netlify

Drag-drop the `mothers-day/` folder at [netlify.com/drop](https://app.netlify.com/drop), or set publish directory to `mothers-day`.

## Features

- Sunset sky with blooming flowers
- Drifting petals (click anywhere for sparkles)
- Butterflies every 20–40s, dragonflies every 50–90s
- Garden sounds toggle (bottom-right, muted by default)
