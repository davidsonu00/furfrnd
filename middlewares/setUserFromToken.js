const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Admin token support
    if (decoded.role === 'admin') {
      req.user = {
        _id: 'admin',
        fullname: 'Admin',
        email: decoded.email,
        role: 'admin',
        cart: []
      };
      return next();
    }

    const user = await userModel.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;

      if (req.session.guestCart?.length > 0) {
        const uniqueItems = [...new Set([
          ...user.cart.map(id => id.toString()),
          ...req.session.guestCart
        ])];

        user.cart = uniqueItems;
        await user.save();
        req.session.guestCart = [];
      }
    } else {
      req.user = null;
      res.clearCookie('token');
    }
  } catch (err) {
    console.error('setUserFromToken Error:', err);
    req.user = null;
    res.clearCookie('token');
  }

  next();
};