# Luna Styles — Site Reference

**Live site:** https://lunastyles.org  
**GitHub repo:** https://github.com/davidpedersen21-dotcom/Lunastyles-  
**Hosted via:** GitHub Pages (branch: `main`, custom domain via `CNAME`)

---

## Tech Stack

Pure static site — no build process, no framework, no npm at runtime.

- Single-file HTML/CSS/JS (`index.html` ~5 MB including embedded base64 assets)
- Vanilla JavaScript (DOM manipulation, IntersectionObserver for scroll reveals)
- Google Fonts (Playfair Display, Crimson Pro, Josefin Sans)
- GitHub Pages for hosting + automatic CDN
- Jekyll config (`_config.yml`) with `render_with_liquid: false` to prevent templating

Node.js is **only** used by GitHub Actions to run `scripts/apply-etsy-data.js` — it is never shipped to the browser.

---

## File Structure

```
/
├── index.html                  ← Entire website (one file, ~891 lines of code)
├── lookbook.html               ← Separate lookbook/catalog page
├── thank-you.html              ← Post-contact-form confirmation page
├── bookmarklet-install.html    ← Drag-to-install page for the Etsy sync bookmarklet
├── CNAME                       ← Custom domain: lunastyles.org
├── _config.yml                 ← GitHub Pages / Jekyll config
├── robots.txt / sitemap.xml    ← SEO
├── reel.mp4                    ← Hero video (auto-play, muted, looped)
├── logo.jpeg                   ← Logo used in nav
├── Maggie Selfie - Owner+Founder.jpeg
├── data/
│   └── etsy-sync.json          ← Written by bookmarklet, read by GitHub Actions
├── scripts/
│   └── apply-etsy-data.js      ← Reads etsy-sync.json, patches index.html markers
├── .github/workflows/
│   └── sync-etsy.yml           ← Triggers on etsy-sync.json push, applies data
└── package.json                ← No dependencies (script only needs Node built-ins)
```

---

## index.html — Site Sections

| Section | HTML anchor | Notes |
|---|---|---|
| Navigation | `.nav` | Links to all on-page sections |
| Hero | `#hero` | Tagline, "Watch Live on Whatnot" CTA |
| Shows | `#shows` | Whatnot live show schedule cards |
| Video | `#watch` | `reel.mp4` auto-play reel |
| Shop | `#shop` | Product grid (auto-synced from Etsy) |
| Instagram | `#instagram` | 4 embedded Instagram posts |
| Reviews | `#reviews` | Customer reviews (auto-synced from Etsy) |
| About | `#about` | Founder story + stats |
| Contact | `#contact` | mailto form → lunastyles2026@gmail.com |
| Footer | — | Links to Etsy, Instagram, Whatnot |

### Color palette (CSS variables in `:root`)
```css
--crimson: #B01030
--burnt-orange: #C85A1A
--kantha-green: #4A7A1E
--kantha-purple: #6B2D8B
--kantha-yellow: #D4A020
--mustard: #B87820
--teal: #1A7A6A
--ink: #1A0A00
--cream: #FBF5E8
```

---

## Etsy Auto-Sync System

### How it works

```
User opens etsy.com/shop/LunaStyles2026Shop
  → clicks "🌙 Luna Sync" bookmarklet
  → bookmarklet scrapes listings + reviews from live DOM
  → calls GitHub API to push data/etsy-sync.json
  → GitHub Actions workflow "Apply Etsy Sync Data" fires
  → runs scripts/apply-etsy-data.js
  → patches index.html between marker comments
  → commits + pushes index.html
  → GitHub Pages rebuilds (~30 seconds)
```

### Bookmarklet setup
Install page: `lunastyles.org/bookmarklet-install.html`  
Requires a GitHub Personal Access Token (repo scope) — stored in browser localStorage under key `_ls_pat`.  
To reset the token: open browser DevTools → Application → Local Storage → delete `_ls_pat`.

### Markers in index.html
The apply script finds and replaces content between these comment markers:

**Products (in `<script>` tag, ~line 844):**
```
// ETSY_LISTINGS_START
const products=[...];
// ETSY_LISTINGS_END
```

**Reviews (in HTML body, ~line 589):**
```
<!-- ETSY_REVIEWS_START -->
...review cards...
<!-- ETSY_REVIEWS_END -->
```
The Overall Ratings bar (`<div class="overall-rating">`) is below the END marker and is **not** touched by the sync.

### Category detection
Listings are tagged by matching words in the title:

| Tag | Matched words |
|---|---|
| Skirts | skirt |
| Dresses | dress, sundress |
| Tops | top, blouse, shirt |
| Hats | hat |
| Accessories | headband, headwrap, scarf |
| Bags | tote, bag, purse |
| Jackets | jacket, kimono, cardigan |
| Pants | pants, trousers |
| Shorts | shorts |
| Accessories *(default)* | (no match) |

---

## GitHub Actions

**Workflow:** `.github/workflows/sync-etsy.yml`  
**Triggers:**
- Push to `data/etsy-sync.json` (bookmarklet flow)
- Manual dispatch from Actions tab

**What it does:**
1. Checks out repo
2. Runs `node scripts/apply-etsy-data.js`
3. If `index.html` changed: commits with `[skip ci]` and pushes

**Safety:** If `etsy-sync.json` has zero products, the script exits without touching `index.html`.

---

## External Platforms

| Platform | URL / Handle |
|---|---|
| Etsy shop | etsy.com/shop/LunaStyles2026Shop |
| Instagram | @lunastyles2026 |
| Whatnot | whatnot.com/s/gisSG3Fk |
| Contact email | lunastyles2026@gmail.com |
| GitHub account | davidpedersen21-dotcom |

---

## Manual Content Edits (no bookmarklet needed)

- **Shows schedule** — edit the `.show-card` blocks in `#shows` section
- **Instagram embeds** — replace `blockquote` embed codes in `#instagram` section
- **About text / stats** — edit `.about-text` in `#about` section
- **Reel video** — replace `reel.mp4` in repo root
- **Overall ratings bar** — edit the `<div class="overall-rating">` block (just below `<!-- ETSY_REVIEWS_END -->`)
- **Whatnot countdown timer** — update the target date in the JS near `#countdown`
