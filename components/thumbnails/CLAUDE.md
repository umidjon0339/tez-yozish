# components/thumbnails/ — parametric SVG registry

Read **`docs/thumbnails.md`** before editing.

Hard rules:
- Every `ThumbnailParams` field stays optional with an in-component
  default — a template must render sensibly with `params` undefined.
- Templates: `viewBox 0 0 400 240`, `React.useId()`-namespaced style/filter
  ids, `prefers-reduced-motion` guards.
- Register in `ThumbnailRegistry` using the `'ID': Component` literal form —
  `scripts/validate-lessons.mjs` scrapes the ids by regex.
- `DynamicThumbnail` must keep its visible never-crash fallback for unknown
  ids.
- `svgsprite-*.svg` files here are inert/unreferenced — ignore them.
