const path = require('path');
const { applySync } = require('./sync-common');

applySync({
  dataFile: path.join(__dirname, '..', 'data', 'etsy-sync.json'),
  indexFile: path.join(__dirname, '..', 'index.html'),
  listingsVarName: 'products',
  listingsStartMarker: '// ETSY_LISTINGS_START',
  listingsEndMarker: '// ETSY_LISTINGS_END',
  reviewsStartMarker: 'ETSY_REVIEWS_START',
  reviewsEndMarker: 'ETSY_REVIEWS_END',
  platformLabel: 'Etsy',
  platformClass: 'platform-etsy',
  defaultAuthor: 'Etsy Customer',
});
