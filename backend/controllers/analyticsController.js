const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getSalesStats = async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $match: { paid: true } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const salesByMonth = await Order.aggregate([
      { $match: { paid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { paid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalOrders: totalSales[0]?.count || 0,
      salesByMonth,
      topProducts
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

