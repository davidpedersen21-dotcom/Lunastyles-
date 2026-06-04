# Luna Styles Website

Handcrafted boutique site for lunastyles.org — hosted on GitHub Pages.

---

## File Structure

```
/
├── index.html          ← The entire website (one clean file)
├── CNAME               ← Custom domain: lunastyles.org
├── reel.mp4            ← Upload your reel video here (not included)
└── images/
    └── magaly.jpg      ← Upload Magaly's photo here (not included)
```

---

## How to Customize

### 1. Add Magaly's Photo
- Save her photo as `images/magaly.jpg`
- In `index.html`, find `about-photo-placeholder` and replace that whole `<div>` with:
  ```html
  <img src="images/magaly.jpg" alt="Magaly, founder of Luna Styles" />
  ```

### 2. Add the Reel Video
- Save your reel video as `reel.mp4` in the root folder (same level as index.html)
- It will auto-play, muted, on loop

### 3. Add Real Etsy Listings
For each listing card in the `#shop` section:
1. Go to etsy.com/shop/lunastyles2026 and open a listing
2. Copy the listing URL (e.g. `https://www.etsy.com/listing/1234567890/item-name`)
3. In `index.html`, find a `<a class="etsy-link-card"` block
4. Set `href="YOUR_LISTING_URL"`
5. Update the `.card-title` text, `.card-price`, and add the listing image:
   - Right-click the main photo on Etsy → Copy image address
   - Replace the `<div class="card-img-placeholder">` with:
     ```html
     <img src="PASTE_IMAGE_URL_HERE" alt="Item name" loading="lazy" />
     ```
6. Repeat for each card. Add or remove cards as needed.

### 4. Add Instagram Embeds
For each post you want to feature:
1. Go to the post on Instagram.com
2. Click the three dots (···) → **Embed**
3. Copy the `<blockquote>` code
4. Replace the placeholder `<blockquote>` in the `insta-grid` section

### 5. Update Sale Countdown
In the `<script>` section, find:
```js
const SALE_END = new Date('2026-07-04T23:59:59-07:00');
```
Change the date to whenever your sale ends.

### 6. Update Email
Search and replace `lunastyles2026@gmail.com` with your real email address.

---

## Deploying to GitHub Pages

### First Time: Branch & Backup, Then Push New Site

**Step 1 — Back up the old site (create a branch)**
```bash
# In GitHub.com:
# 1. Go to your repo: github.com/davidpedersen21-dotcom/Lunastyles-
# 2. Click the branch dropdown (says "main")
# 3. Type: backup-2026-06
# 4. Click "Create branch: backup-2026-06 from main"
# ✅ Your old site is now safely preserved in that branch forever
```

**Step 2 — Upload the new files to main**
```bash
# Option A — GitHub Web Interface (easiest):
# 1. Go to your repo on GitHub
# 2. Click "Add file" → "Upload files"
# 3. Drag and drop ALL files from this zip
# 4. Select "Commit directly to the main branch"
# 5. Click "Commit changes"

# Option B — Git command line:
git clone https://github.com/davidpedersen21-dotcom/Lunastyles-
cd Lunastyles-
git checkout -b backup-2026-06   # create backup branch
git push origin backup-2026-06    # push backup

# Now replace files with new ones, then:
git add -A
git commit -m "Rebuild: clean dark redesign v2"
git push origin main
```

**Step 3 — Verify GitHub Pages is enabled**
1. Go to repo Settings → Pages
2. Source: Deploy from branch → `main` → `/ (root)`
3. Custom domain: `lunastyles.org`
4. ✅ Check "Enforce HTTPS"

Your site will be live at lunastyles.org within ~2 minutes of pushing.

---

## Restoring the Old Site
If you ever want to go back:
```bash
# GitHub web: switch to the backup-2026-06 branch and it's all there
# Command line:
git checkout backup-2026-06
```

---

## No Dependencies
This site is pure HTML/CSS/JS — no build tools, no npm, no Node, no Netlify functions.
It will work on GitHub Pages exactly as-is.
