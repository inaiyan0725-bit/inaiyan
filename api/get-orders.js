export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ message: "Use POST request" });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone required' });
  }

  const shopifyRes = await fetch(
    `https://uknxa1-mk.myshopify.com/admin/api/2024-01/orders.json?status=any&limit=50`,
    {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await shopifyRes.json();

  const userOrders = data.orders.filter(order => {
    const orderPhone =
      order.phone ||
      order.billing_address?.phone ||
      order.shipping_address?.phone ||
      '';

    return orderPhone.replace(/\D/g,'').includes(phone.replace(/\D/g,''));
  });

  const orders = userOrders.map(o => ({
    id: o.id,
    orderNumber: o.name,
    status: o.fulfillment_status || 'processing',
    total: `₹${parseFloat(o.total_price).toLocaleString('en-IN')}`,
    createdAt: o.created_at,
    items: o.line_items.map(i => ({
      title: i.title,
      qty: i.quantity,
      price: `₹${parseFloat(i.price).toLocaleString('en-IN')}`,
      image: i.image?.src || ''
    }))
  }));

  return res.status(200).json({ orders });
}
