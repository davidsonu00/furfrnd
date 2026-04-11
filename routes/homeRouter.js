const express = require('express');
const router = express.Router();
const Product = require('../models/product-model');
const dogModel = require('../models/dog-model');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().limit(6);
    const dogs = await dogModel.find().limit(6);

    res.render('index', {
      products,
      dogs,
      modal: req.query.modal || null,
      step: req.query.step || null,
      email: req.query.email || ''
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server error loading homepage');
  }
});

module.exports = router;