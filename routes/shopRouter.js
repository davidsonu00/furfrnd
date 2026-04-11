const express = require('express');
const router = express.Router();
const Product = require('../models/product-model');
const isLoggedIn = require('../middlewares/isLoggedIn');
const userModel = require('../models/user-model');
const dogModel = require('../models/dog-model');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    const cartCount = req.user?.cart?.length || req.session.guestCart?.length || 0;
    res.render('shop', { products, cartCount, user: req.user });
  } catch (err) {
    console.log(err.message);
    req.flash('error', 'Could not load shop.');
    res.redirect('/');
  }
});

router.get('/cart', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).populate('cart');

    if (!user) {
      throw new Error('User not found');
    }

    const cartItems = user.cart.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    }));

    res.render('cart', { cart: cartItems });
  } catch (err) {
    console.error('Cart error:', err);
    req.flash('error', 'Could not load cart.');
    res.redirect('/shop');
  }
});

router.get('/addToCart/:id', async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin') {
      await userModel.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { cart: req.params.id } },
        { new: true }
      );
      req.flash('success', 'Added to Cart');
    } else {
      if (!req.session.guestCart) req.session.guestCart = [];
      if (!req.session.guestCart.includes(req.params.id)) {
        req.session.guestCart.push(req.params.id);
      }
      req.flash('success', 'Added to Cart (Guest)');
    }

    res.redirect('/shop');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add to cart');
    res.redirect('/shop');
  }
});

router.get('/cart/remove/:id', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const index = user.cart.indexOf(req.params.id);

    if (index > -1) {
      user.cart.splice(index, 1);
    }

    await user.save();
    req.flash('success', 'Item removed from cart');
    res.redirect('/shop/cart');
  } catch (err) {
    console.error('Remove from cart error:', err);
    req.flash('error', 'Could not remove item from cart.');
    res.redirect('/shop/cart');
  }
});

router.get('/cart/clear', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    user.cart = [];
    await user.save();

    req.flash('success', 'All items removed from cart');
    res.redirect('/shop/cart');
  } catch (err) {
    console.error('Clear cart error:', err);
    req.flash('error', 'Could not clear cart.');
    res.redirect('/shop/cart');
  }
});

router.get('/dog/:id', async (req, res) => {
  try {
    const dog = await dogModel.findById(req.params.id);
    if (!dog) {
      return res.status(404).send('Dog not found');
    }
    res.render('dog', { dog });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching dog details');
  }
});

module.exports = router;