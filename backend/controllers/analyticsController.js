const adapter = require('../models/adapter');

exports.getSalesStats = async (req, res) => {
  try {
    // Use adapter.Order to compute simple aggregates. For complex analytics, consider
    // adding raw SQL queries or a dedicated analytics table.
    const orders = await adapter.Order.find ? await adapter.Order.findAll ? await adapter.Order.findAll() : await adapter.Order.find() : [];

    const paidOrders = (Array.isArray(orders) ? orders : []).filter(o => o.paid || o.paid === true || o.paid === 'true');
    const totalSales = paidOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalOrders = paidOrders.length;

    // sales by month (YYYY-MM)
    const salesByMonthMap = {};
    for (const o of paidOrders) {
      const d = new Date(o.createdAt || o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      salesByMonthMap[key] = salesByMonthMap[key] || { total: 0, count: 0 };
      salesByMonthMap[key].total += Number(o.total) || 0;
      salesByMonthMap[key].count += 1;
    }
    const salesByMonth = Object.keys(salesByMonthMap).sort().map(k => ({ month: k, ...salesByMonthMap[k] }));

    // top products by items sold
    const productTotals = {};
    for (const o of paidOrders) {
      const items = o.items || [];
      for (const it of items) {
        const pid = it.product || (it.productId || it.product_id);
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        productTotals[pid] = productTotals[pid] || { totalSold: 0, totalRevenue: 0 };
        productTotals[pid].totalSold += qty;
        productTotals[pid].totalRevenue += qty * price;
      }
    }

    const topProductsArr = Object.keys(productTotals).map(pid => ({ productId: pid, ...productTotals[pid] }));
    topProductsArr.sort((a, b) => b.totalSold - a.totalSold);
    const topProducts = topProductsArr.slice(0, 10);

    // Try to enrich with product names when possible
    const productIds = topProducts.map(p => p.productId).filter(Boolean);
    const products = (productIds.length && adapter.Product.find) ? await adapter.Product.find({ id: productIds }) : [];
    const nameMap = {};
    for (const p of Array.isArray(products) ? products : []) nameMap[p.id || p._id || p.productId] = p.name;
    const topProductsWithNames = topProducts.map(tp => ({ ...tp, productName: nameMap[tp.productId] || null }));

    res.json({ totalSales, totalOrders, salesByMonth, topProducts: topProductsWithNames });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

