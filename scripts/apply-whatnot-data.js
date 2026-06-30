const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'whatnot-sync.json');
const INDEX_HTML = path.join(__dirname, '..', 'index.html');

function buildReviewCard(r) {
  const rating = Math.min(5, Math.max(1, r.rating || 5));
  const stars = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
  const text = (r.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const dateLine = r.date ? `\n        <div class="review-date">${r.date}</div>` : '';
  return `      <div class="review-card reveal">
        <span class="review-platform platform-whatnot">Whatnot</span>
        <div class="review-stars-sm">${stars}</div>
        <p class="review-text">"${text}"</p>
        <div class="review-author">${r.author || 'Whatnot Customer'}</div>${dateLine}
      </div>`;
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const { products = [], reviews = [] } = data;

if (products.length === 0) {
  console.error('No products in data file — aborting to protect existing site');
  process.exit(1);
}

let html = fs.readFileSync(INDEX_HTML, 'utf8');

const listingsRe = /\/\/ WHATNOT_LISTINGS_START[\s\S]*?\/\/ WHATNOT_LISTINGS_END/;
if (listingsRe.test(html)) {
  html = html.replace(listingsRe,
    `// WHATNOT_LISTINGS_START\nconst whatnotProducts=${JSON.stringify(products)};\n// WHATNOT_LISTINGS_END`);
  console.log(`Patched ${products.length} Whatnot listings`);
} else {
  console.error('WHATNOT_LISTINGS_START marker missing from index.html');
}

if (reviews.length > 0) {
  const reviewsHtml = reviews.map(buildReviewCard).join('\n');
  const reviewsRe = /<!-- WHATNOT_REVIEWS_START -->[\s\S]*?<!-- WHATNOT_REVIEWS_END -->/;
  if (reviewsRe.test(html)) {
    html = html.replace(reviewsRe,
      `<!-- WHATNOT_REVIEWS_START -->\n${reviewsHtml}\n      <!-- WHATNOT_REVIEWS_END -->`);
    console.log(`Patched ${reviews.length} Whatnot reviews`);
  } else {
    console.error('WHATNOT_REVIEWS_START marker missing from index.html');
  }
}

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('Done — index.html updated.');
