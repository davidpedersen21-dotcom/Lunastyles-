const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SHOP = 'LunaStyles2026Shop';
const INDEX_HTML = path.join(__dirname, '..', 'index.html');

function detectCategory(title) {
  const t = title.toLowerCase();
  if (t.match(/\bskirt\b/)) return 'Skirts';
  if (t.match(/\bdress\b|\bsundress\b/)) return 'Dresses';
  if (t.match(/\btop\b|\bblouse\b|\bshirt\b/)) return 'Tops';
  if (t.match(/\bhat\b/)) return 'Hats';
  if (t.match(/\bheadband\b|\bheadwrap\b|\bscarf\b/)) return 'Accessories';
  if (t.match(/\btote\b|\bbag\b|\bpurse\b/)) return 'Bags';
  if (t.match(/\bjacket\b|\bkimono\b|\bcardigan\b/)) return 'Jackets';
  if (t.match(/\bpants?\b|\btrousers?\b/)) return 'Pants';
  if (t.match(/\bshorts?\b/)) return 'Shorts';
  return 'Accessories';
}

function cleanImageUrl(url) {
  return url.replace(/\?.*$/, '').replace(/il_\d+x[nN\d]+\./i, 'il_340x270.');
}

function formatPrice(raw) {
  if (!raw) return '';
  const match = raw.replace(/\s+/g, '').match(/\$?[\d,]+(?:\.\d{2})?/);
  if (!match) return '';
  const num = parseFloat(match[0].replace(/[$,]/g, ''));
  return isNaN(num) ? '' : `$${num % 1 === 0 ? num : num.toFixed(2)}`;
}

async function scrapeShopPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await page.click('button[data-gdpr-single-choice-accept]', { timeout: 3000 }); } catch {}
  await page.waitForTimeout(2500);

  // Scroll to trigger lazy-loaded images
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  return page.evaluate(() => {
    const seen = new Set();
    const results = [];

    document.querySelectorAll('a[href*="/listing/"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const raw = href.startsWith('http') ? href : `https://www.etsy.com${href}`;
      const url = raw.split('?')[0];
      if (seen.has(url) || !url.includes('/listing/')) return;
      seen.add(url);

      const title =
        link.getAttribute('aria-label') ||
        link.querySelector('h3')?.textContent?.trim() ||
        link.querySelector('[class*="title"]')?.textContent?.trim();
      if (!title || title.length < 3) return;

      const img = link.querySelector('img');
      const imgSrc = img?.getAttribute('src') || img?.getAttribute('data-src') || img?.currentSrc || '';
      if (!imgSrc || !imgSrc.includes('etsy')) return;

      let card = link;
      let priceEl = null;
      for (let i = 0; i < 5 && !priceEl; i++) {
        card = card.parentElement;
        if (!card) break;
        priceEl = card.querySelector('[class*="price"], .currency-value, [data-currency]');
      }
      const price = priceEl?.textContent?.trim() || '';

      results.push({ url, img: imgSrc, title, price });
    });

    return results;
  });
}

async function scrapeReviews(page) {
  await page.goto(`https://www.etsy.com/shop/${SHOP}/reviews`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(2500);

  return page.evaluate(() => {
    const results = [];

    // Etsy review containers — try multiple selector strategies
    let containers = Array.from(document.querySelectorAll('[data-review-region]'));
    if (containers.length === 0) {
      containers = Array.from(document.querySelectorAll('[class*="review-item"], [class*="ReviewItem"]'));
    }
    if (containers.length === 0) {
      // Broad fallback: any element with a paragraph and star-like content nearby
      containers = Array.from(document.querySelectorAll('li, article')).filter(el =>
        el.querySelector('p') && el.textContent.includes('★')
      );
    }

    containers.forEach(el => {
      // Star rating
      const filled = el.querySelectorAll('[class*="filled"], [aria-label*="star filled"], [aria-label*="5 out"]');
      const ratingAttr = el.querySelector('[aria-label]')?.getAttribute('aria-label') || '';
      const ratingMatch = ratingAttr.match(/(\d+)\s*out\s*of/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : (filled.length || 5);

      // Review text
      const textEl = el.querySelector('p, [class*="review-text"], [class*="body"]');
      const text = textEl?.textContent?.trim();
      if (!text || text.length < 10) return;

      // Reviewer name
      const nameEl = el.querySelector('[class*="buyer"], [class*="reviewer"], [class*="user-display-name"], [class*="username"]');
      const author = nameEl?.textContent?.trim() || 'Etsy Customer';

      // Date
      const dateEl = el.querySelector('time, [class*="date"]');
      const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || '';

      if (rating >= 4) results.push({ rating, text, author, date });
    });

    return results.slice(0, 8);
  });
}

function buildReviewCard(r) {
  const stars = '★'.repeat(Math.min(5, r.rating)) + '☆'.repeat(5 - Math.min(5, r.rating));
  const text = r.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dateLine = r.date ? `\n        <div class="review-date">${r.date}</div>` : '';
  return `      <div class="review-card reveal">
        <span class="review-platform platform-etsy">Etsy</span>
        <div class="review-stars-sm">${stars}</div>
        <p class="review-text">"${text}"</p>
        <div class="review-author">${r.author}</div>${dateLine}
      </div>`;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  // Remove headless fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  let products = [];
  let reviewsHtml = '';

  // ── Listings ────────────────────────────────────────────────────
  try {
    console.log('Scraping page 1...');
    const p1 = await scrapeShopPage(page, `https://www.etsy.com/shop/${SHOP}`);
    products.push(...p1);
    console.log(`Page 1: ${p1.length} listings`);

    for (let p = 2; p <= 10; p++) {
      const pN = await scrapeShopPage(page, `https://www.etsy.com/shop/${SHOP}?page=${p}`);
      const fresh = pN.filter(n => !products.find(e => e.url === n.url));
      if (fresh.length === 0) break;
      products.push(...fresh);
      console.log(`Page ${p}: +${fresh.length} listings`);
    }

    products = products.map(p => ({
      url: p.url,
      img: cleanImageUrl(p.img),
      name: p.title.split(/\s*[-–|]\s*/)[0].trim().substring(0, 60),
      tag: detectCategory(p.title),
      price: formatPrice(p.price),
    }));

    console.log(`Total: ${products.length} listings found`);
  } catch (err) {
    console.error('Listings scrape failed:', err.message);
    await browser.close();
    process.exit(0); // keep existing data, don't fail CI
  }

  if (products.length === 0) {
    console.warn('Zero listings found — likely bot-blocked. Keeping existing data.');
    await browser.close();
    process.exit(0);
  }

  // ── Reviews ─────────────────────────────────────────────────────
  try {
    console.log('Scraping reviews...');
    const reviews = await scrapeReviews(page);
    if (reviews.length > 0) {
      reviewsHtml = reviews.map(buildReviewCard).join('\n');
      console.log(`Got ${reviews.length} reviews`);
    } else {
      console.warn('No reviews parsed — keeping existing reviews in HTML');
    }
  } catch (err) {
    console.error('Reviews scrape failed (keeping existing):', err.message);
  }

  await browser.close();

  // ── Patch index.html ────────────────────────────────────────────
  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  const listingsRe = /\/\/ ETSY_LISTINGS_START[\s\S]*?\/\/ ETSY_LISTINGS_END/;
  if (listingsRe.test(html)) {
    html = html.replace(
      listingsRe,
      `// ETSY_LISTINGS_START\nconst products=${JSON.stringify(products)};\n// ETSY_LISTINGS_END`
    );
    console.log('Products patched');
  } else {
    console.error('ETSY_LISTINGS_START marker missing from index.html');
  }

  if (reviewsHtml) {
    const reviewsRe = /<!-- ETSY_REVIEWS_START -->[\s\S]*?<!-- ETSY_REVIEWS_END -->/;
    if (reviewsRe.test(html)) {
      html = html.replace(
        reviewsRe,
        `<!-- ETSY_REVIEWS_START -->\n${reviewsHtml}\n      <!-- ETSY_REVIEWS_END -->`
      );
      console.log('Reviews patched');
    } else {
      console.error('ETSY_REVIEWS_START marker missing from index.html');
    }
  }

  fs.writeFileSync(INDEX_HTML, html, 'utf8');
  console.log('Done — index.html updated.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
