const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'etsy-sync.json');
const INDEX_HTML = path.join(__dirname, '..', 'index.html');

// The bookmarklet scraper occasionally grabs the reviewer "name on date" byline
// instead of the actual review body (an Etsy DOM-structure quirk). Rendering
// that as a quoted review reads as broken/fake, so detect and skip the quote
// line rather than show it.
const NAME_ON_DATE_RE = /^([A-Za-z .'-]+) on ([A-Za-z]+ \d{1,2}, \d{4})$/;

function buildReviewCard(r) {
  const rating = Math.min(5, Math.max(1, r.rating || 5));
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const rawText = (r.text || '').trim();
  const bylineMatch = rawText.match(NAME_ON_DATE_RE);
  let author = r.author;
  let date = r.date;
  let quoteLine = '';
  if (bylineMatch) {
    // Scraper grabbed the "Name on Date" byline instead of the review body —
    // salvage the name/date instead of rendering it as a fake quote.
    if (!author || author === 'Etsy Customer') author = bylineMatch[1];
    if (!date) date = bylineMatch[2];
  } else if (rawText) {
    const text = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    quoteLine = `\n        <p class="review-text">"${text}"</p>`;
  }
  const dateLine = date ? `\n        <div class="review-date">${date}</div>` : '';
  return `      <div class="review-card reveal">
        <span class="review-platform platform-etsy">Etsy</span>
        <div class="review-stars-sm">${stars}</div>${quoteLine}
        <div class="review-author">${author || 'Etsy Customer'}</div>${dateLine}
      </div>`;
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const { products = [] } = data;
// Dedupe reviews that are exact repeats (same text+author) — a symptom of the
// same scraper quirk grabbing the same DOM node more than once.
const seenReviews = new Set();
const reviews = (data.reviews || []).filter(r => {
  const key = `${r.text || ''}|${r.author || ''}|${r.date || ''}`;
  if (seenReviews.has(key)) return false;
  seenReviews.add(key);
  return true;
});

if (products.length === 0) {
  console.error('No products in data file — aborting to protect existing site');
  process.exit(1);
}

let html = fs.readFileSync(INDEX_HTML, 'utf8');

// Patch products array
const listingsRe = /\/\/ ETSY_LISTINGS_START[\s\S]*?\/\/ ETSY_LISTINGS_END/;
if (listingsRe.test(html)) {
  html = html.replace(
    listingsRe,
    `// ETSY_LISTINGS_START\nconst products=${JSON.stringify(products)};\n// ETSY_LISTINGS_END`
  );
  console.log(`Patched ${products.length} listings`);
} else {
  console.error('ETSY_LISTINGS_START marker missing from index.html');
}

// Patch reviews (only when we have some)
if (reviews.length > 0) {
  const reviewsHtml = reviews.map(buildReviewCard).join('\n');
  const reviewsRe = /<!-- ETSY_REVIEWS_START -->[\s\S]*?<!-- ETSY_REVIEWS_END -->/;
  if (reviewsRe.test(html)) {
    html = html.replace(
      reviewsRe,
      `<!-- ETSY_REVIEWS_START -->\n${reviewsHtml}\n      <!-- ETSY_REVIEWS_END -->`
    );
    console.log(`Patched ${reviews.length} reviews`);
  } else {
    console.error('ETSY_REVIEWS_START marker missing from index.html');
  }
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Done — index.html updated.');
