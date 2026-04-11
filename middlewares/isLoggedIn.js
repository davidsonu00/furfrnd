const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');



module.exports = async function (req, res, next) {

  if (!req.session.guestCart) {
    req.session.guestCart = [];
  }

  const token = req.cookies.token;

  if (!token) {
    
    req.flash('error', 'Please login first.');
  
    return res.redirect('/?modal=user-login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Admin login from env-based token
    if (decoded.role === 'admin') {
      req.user = {
        _id: 'admin',
        fullname: 'Admin',
        email: decoded.email,
        role: 'admin',
        cart: []
      };

      res.locals.currentUser = req.user;
  
      return next();
    }


    // Normal user login from DB
    const user = await userModel.findById(decoded.id).select('-password');

    if (!user) {
 
      req.flash('error', 'User not found.');
      res.clearCookie('token');
     
      return res.redirect('/?modal=user-login');
    }

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

    res.locals.currentUser = req.user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.clearCookie('token');
    req.flash('error', 'Session expired. Please login again.');
    
    return res.redirect('/?modal=user-login');
  }
};