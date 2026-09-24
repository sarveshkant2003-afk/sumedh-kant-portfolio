# Sumedh Kant, video editor

Portfolio site for Sumedh Kant, a video editor in Pune, India.

A static site: open `index.html` or serve the folder with any static host
(GitHub Pages, Netlify, Vercel). No build step.

- `index.html`: the page
- `site.css`, `site.js`: page styles and behaviour
- `scrollcraft.css`, `scrollcraft.js`: the scroll engine
- `data.js`: the edit-bay clips (timeline data)
- `assets/`: photos, hero layers, reel excerpts and thumbnails

To add a video to the bin, copy one `<li class="clip">` block inside
`<ul class="bin__grid">` in `index.html`, change the YouTube id, title, length,
category and channel, and put its thumbnail in `assets/bin/<id>.webp`. The
"What I cut" counts update themselves.
