const mongoose = require('mongoose');
const debug = require('debug')('development:mongoose');

const dbUri = process.env.MONGODB_URI || require('config').get('MONGODB_URI');

mongoose.connect(dbUri)
  .then(() => {
    debug('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    debug('❌ MongoDB connection error:', err);
  });

mongoose.connection.on('disconnected', () => {
  debug('❌ MongoDB disconnected');
});

module.exports = mongoose.connection;