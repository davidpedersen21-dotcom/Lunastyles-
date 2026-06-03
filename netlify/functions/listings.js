exports.handler = async function () {
  const apiKey = process.env.ETSY_API_KEY;
  const shopName = "Lunastyles2026Shop";

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing ETSY_API_KEY" }),
    };
  }

  try {
    const shopRes = await fetch(
      `https://api.etsy.com/v3/application/shops?shop_name=${encodeURIComponent(shopName)}`,
      {
        headers: { "x-api-key": apiKey },
      }
    );

    const shopData = await shopRes.json();
    const shop = shopData.results?.[0];

    if (!shop?.shop_id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Shop not found", shopData }),
      };
    }

    const listingsRes = await fetch(
      `https://api.etsy.com/v3/application/shops/${shop.shop_id}/listings/active?limit=100&includes=Images`,
      {
        headers: { "x-api-key": apiKey },
      }
    );

    const listingsData = await listingsRes.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(listingsData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
