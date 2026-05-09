
require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/skillbridge',
  JWT_SECRET: process.env.JWT_SECRET || 'skill-bridge-secret-key-change-in-production',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_EMAIL: 'skillbridge@gmail.com',
  ADMIN_PASSWORD_HASH: '$2a$10$.cnLDpfF6iohTYFz.ytZfOTixsto9f4buXk4l/ZqeNsj8/aayAOlO' // CUI<078&061>
};
