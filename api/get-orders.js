export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  // Fetch orders from Shopify Admin API
  const shopifyRes = await fetch(
    `https://YOUR-STORE.myshopify.com/admin/api/2024-01/orders.json?status=any&limit=50`,
    {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await shopifyRes.json();

  // Filter orders by phone number
  const userOrders = data.orders.filter(order => {
    const orderPhone = order.phone ||
      order.billing_address?.phone ||
      order.shipping_address?.phone || '';
    return orderPhone.replace(/\D/g,'').includes(phone.replace(/\D/g,''));
  });

  const orders = userOrders.map(o => ({
    id: o.id,
    orderNumber: o.name,
    status: o.fulfillment_status || 'processing',
    financialStatus: o.financial_status,
    total: `₹${parseFloat(o.total_price).toLocaleString('en-IN')}`,
    createdAt: o.created_at,
    items: o.line_items.map(i => ({
      title: i.title,
      qty: i.quantity,
      price: `₹${parseFloat(i.price).toLocaleString('en-IN')}`,
      image: i.image?.src || ''
    })),
    trackingUrl: o.fulfillments?.[0]?.tracking_url || null
  }));

  res.status(200).json({ orders });
}
