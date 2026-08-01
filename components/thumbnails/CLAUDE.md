# components/thumbnails/ — parametric SVG registry

Read **`docs/thumbnails.md`** before editing.

Hard rules:
- Every `ThumbnailParams` field stays optional with an in-component
  default — a template must render sensibly with `params` undefined.
- Templates: `viewBox 0 0 400 240`, `React.useId()`-namespaced style/filter
  ids, `prefers-reduced-motion` guards.
- **UI-style covers** (panel + keycaps + legends) paint their neutrals with
  the `--thumb-*` variables from `globals.css`, never hard-coded hex — they
  have to follow dark mode like the rest of the chrome. Give every cap an
  edge stroke (`var(--thumb-edge)`): the drop shadows are invisible on a
  dark panel. **Scene covers** (the game art) are illustrations and keep
  their painted palettes.
- Register in `ThumbnailRegistry` using the `'ID': Component` literal form —
  `scripts/validate-lessons.mjs` scrapes the ids by regex.
- `DynamicThumbnail` must keep its visible never-crash fallback for unknown
  ids.
- `svgsprite-*.svg` files here are inert/unreferenced — ignore them.
