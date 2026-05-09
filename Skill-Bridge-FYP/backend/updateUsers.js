const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const config = require('./config');

mongoose.connect(config.MONGODB_URI).then(async () => {
  await User.updateMany({ status: { $exists: false } }, { status: 'Active' });
  console.log('Updated existing users');
  process.exit(0);
}).catch(console.error);