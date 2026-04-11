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
      user: req.user || req.session.user || null,
      success: req.flash('success'),
      error: req.flash('error'),
      modal: req.query.modal || null,
      step: req.query.step || null,
      email: req.query.email || ''
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server error loading homepage');
  }
});

router.get('/shop', async (req, res) => {
  try {
    const dogs = await dogModel.find();

    const products = dogs.map((dog) => ({
      _id: dog._id,
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      gender: dog.gender,
      vaccination: dog.vaccination,
      size: dog.size,
      price: dog.price,
      image: dog.image,
      traits: dog.traits || []
    }));

    res.render('shop', {
      products,
      user: req.user || req.session.user || null,
      success: req.flash('success'),
      error: req.flash('error'),
      modal: req.query.modal || null,
      step: req.query.step || null,
      email: req.query.email || ''
    });
  } catch (err) {
    console.error('Shop page error:', err);
    res.status(500).send('Server error loading shop page');
  }
});

module.exports = router;