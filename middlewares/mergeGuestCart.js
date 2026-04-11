const userModel = require('../models/user-model');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.session?.guestCart?.length) {
      return next();
    }

    // Admin does not have a database cart
    if (req.user.role === 'admin') {
      return next();
    }

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return next();
    }

    const uniqueItems = [...new Set([
      ...user.cart.map(id => id.toString()),
      ...req.session.guestCart
    ])];

    user.cart = uniqueItems;
    await user.save();

    req.session.guestCart = [];
    console.log('Merged guest cart with user account');

    next();
  } catch (err) {
    console.error('Cart merge error:', err);
    next();
  }
};