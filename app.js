require('dotenv').config();

const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
require('./config/mongoose-connection');

const homeRouter = require('./routes/homeRouter');
const registerRouter = require('./routes/registerRouter');
const adminRouter = require('./routes/adminRouter');
const shopRouter = require('./routes/shopRouter');
const usersRouter = require('./routes/usersRouter');

const setUserFromToken = require('./middlewares/setUserFromToken');
const mergeGuestCart = require('./middlewares/mergeGuestCart');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET || 'furfrnd_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 30
  }
}));

app.use(flash());
app.use(setUserFromToken);

app.use((req, res, next) => {
  if (!req.session.guestCart) req.session.guestCart = [];
  next();
});

app.use(mergeGuestCart);

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentUser = req.user || null;
  res.locals.cartCount = req.user?.cart?.length || req.session.guestCart?.length || 0;

  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');

  res.locals.modal = req.query.modal || '';
  res.locals.email = req.query.email || '';

  next();
});

app.use('/', homeRouter);
app.use('/register', registerRouter);
app.use('/admin', adminRouter);
app.use('/shop', shopRouter);
app.use('/users', usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));