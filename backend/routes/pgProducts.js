const express = require('express');
const router = express.Router();

module.exports = (pg) => {
  const { Product } = pg;

  router.get('/', async (req, res) => {
    try {
      const products = await Product.findAll();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: 'PG read error', error: err.message });
    }
  });

  router.get('/:slug', async (req, res) => {
    try {
      const product = await Product.findOne({ where: { slug: req.params.slug } });
      if (!product) return res.status(404).json({ message: 'Not found' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: 'PG read error', error: err.message });
    }
  });

  return router;
};
