const path = require('path');
const { applySync } = require('./sync-common');

applySync({
  dataFile: path.join(__dirname, '..', 'data', 'whatnot-sync.json'),
  indexFile: path.join(__dirname, '..', 'index.html'),
  listingsVarName: 'whatnotProducts',
  listingsStartMarker: '// WHATNOT_LISTINGS_START',
  listingsEndMarker: '// WHATNOT_LISTINGS_END',
  reviewsStartMarker: 'WHATNOT_REVIEWS_START',
  reviewsEndMarker: 'WHATNOT_REVIEWS_END',
  platformLabel: 'Whatnot',
  platformClass: 'platform-whatnot',
  defaultAuthor: 'Whatnot Customer',
});
