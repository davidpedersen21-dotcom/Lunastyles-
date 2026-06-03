import fs from 'node:fs/promises';

const API_KEY = process.env.ETSY_API_KEY || '9std55k55yf2n0crvrq8qslm';
const SHOP_NAME = 'LunaStyles2026Shop';
const OUT = 'data/listings.json';

async function etsyFetch(url) {
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

function normalizePrice(price) {
  if (!price) return '';
  if (price.amount && price.divisor) return `$${(Number(price.amount) / Number(price.divisor)).toFixed(2)}`;
  return '';
}

const shopData = await etsyFetch(`https://api.etsy.com/v3/application/shops?shop_name=${encodeURIComponent(SHOP_NAME)}`);
const shop = shopData.results?.[0];
if (!shop?.shop_id) throw new Error(`Shop not found: ${SHOP_NAME}`);

let offset = 0;
const limit = 100;
const listings = [];
let total = Infinity;

while (offset < total) {
  const data = await etsyFetch(`https://api.etsy.com/v3/application/shops/${shop.shop_id}/listings/active?limit=${limit}&offset=${offset}&includes[]=Images`);
  total = data.count ?? 0;
  for (const l of data.results || []) {
    listings.push({
      listing_id: l.listing_id,
      title: l.title,
      url: l.url,
      price: normalizePrice(l.price),
      image: l.images?.[0]?.url_570xN || l.images?.[0]?.url_fullxfull || '',
      images: (l.images || []).map(img => ({
        url_570xN: img.url_570xN,
        url_fullxfull: img.url_fullxfull
      })),
      quantity: l.quantity,
      tags: l.tags || []
    });
  }
  offset += (data.results || []).length;
  if (!(data.results || []).length) break;
}

await fs.mkdir('data', { recursive: true });
await fs.writeFile(OUT, JSON.stringify({
  updated_at: new Date().toISOString(),
  source: 'Etsy Open API via GitHub Actions',
  shop_name: SHOP_NAME,
  listings
}, null, 2));
console.log(`Wrote ${listings.length} listings to ${OUT}`);
