const fs = require('fs');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReviewCard(r, { platformLabel, platformClass, defaultAuthor }) {
  const rating = Math.min(5, Math.max(1, r.rating || 5));
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const text = escapeHtml(r.text || '');
  const author = escapeHtml(r.author || defaultAuthor);
  const dateLine = r.date ? `\n        <div class="review-date">${escapeHtml(r.date)}</div>` : '';
  return `      <div class="review-card reveal">
        <span class="review-platform ${platformClass}">${platformLabel}</span>
        <div class="review-stars-sm">${stars}</div>
        <p class="review-text">"${text}"</p>
        <div class="review-author">${author}</div>${dateLine}
      </div>`;
}

function applySync({
  dataFile,
  indexFile,
  listingsVarName,
  listingsStartMarker,
  listingsEndMarker,
  reviewsStartMarker,
  reviewsEndMarker,
  platformLabel,
  platformClass,
  defaultAuthor,
}) {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const { products = [], reviews = [] } = data;

  if (products.length === 0) {
    console.error('No products in data file — aborting to protect existing site');
    process.exit(1);
  }

  let html = fs.readFileSync(indexFile, 'utf8');

  const listingsRe = new RegExp(`${listingsStartMarker}[\\s\\S]*?${listingsEndMarker}`);
  if (listingsRe.test(html)) {
    html = html.replace(
      listingsRe,
      `${listingsStartMarker}\nconst ${listingsVarName}=${JSON.stringify(products)};\n${listingsEndMarker}`
    );
    console.log(`Patched ${products.length} listings`);
  } else {
    console.error(`${listingsStartMarker} marker missing from ${indexFile}`);
  }

  if (reviews.length > 0) {
    const reviewsHtml = reviews
      .map((r) => buildReviewCard(r, { platformLabel, platformClass, defaultAuthor }))
      .join('\n');
    const reviewsRe = new RegExp(`<!-- ${reviewsStartMarker} -->[\\s\\S]*?<!-- ${reviewsEndMarker} -->`);
    if (reviewsRe.test(html)) {
      html = html.replace(
        reviewsRe,
        `<!-- ${reviewsStartMarker} -->\n${reviewsHtml}\n      <!-- ${reviewsEndMarker} -->`
      );
      console.log(`Patched ${reviews.length} reviews`);
    } else {
      console.error(`${reviewsStartMarker} marker missing from ${indexFile}`);
    }
  }

  fs.writeFileSync(indexFile, html, 'utf8');
  console.log('Done — index.html updated.');
}

module.exports = { escapeHtml, buildReviewCard, applySync };
