// netlify/functions/listings.js
// Fetches live listings from the Etsy Open API v3

exports.handler = async (event) => {
  const API_KEY = process.env.ETSY_API_KEY;
  const SHOP_NAME = 'LunaStyles2026Shop';

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ETSY_API_KEY environment variable is not set' })
    };
  }

  const limit  = parseInt(event.queryStringParameters?.limit  || '24', 10);
  const offset = parseInt(event.queryStringParameters?.offset || '0',  10);

  try {
    // Step 1: Get the numeric shop ID from the shop name
    const shopRes = await fetch(
      `https://openapi.etsy.com/v3/application/shops?shop_name=${SHOP_NAME}`,
      { headers: { 'x-api-key': API_KEY } }
    );

    if (!shopRes.ok) {
      const err = await shopRes.text();
      return {
        statusCode: shopRes.status,
        body: JSON.stringify({ error: `Shop lookup failed: ${err}` })
      };
    }

    const shopData = await shopRes.json();
    const shop = shopData.results?.[0];
    if (!shop) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Shop '${SHOP_NAME}' not found` })
      };
    }

    const shopId = shop.shop_id;

    // Step 2: Fetch active listings
    const listingsRes = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}&includes[]=Images`,
      { headers: { 'x-api-key': API_KEY } }
    );

    if (!listingsRes.ok) {
      const err = await listingsRes.text();
      return {
        statusCode: listingsRes.status,
        body: JSON.stringify({ error: `Listings fetch failed: ${err}` })
      };
    }

    const listingsData = await listingsRes.json();

    // Normalize to what the frontend expects
    const listings = (listingsData.results || []).map(l => ({
      listing_id: l.listing_id,
      title: l.title,
      url: l.url,
      price: l.price,
      images: (l.images || []).map(img => ({
        url_570xN: img.url_570xN,
        url_fullxfull: img.url_fullxfull,
      })),
      quantity: l.quantity,
      tags: l.tags || [],
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300',  // cache 5 min on CDN
      },
      body: JSON.stringify({
        listings,
        total: listingsData.count,
        offset,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
