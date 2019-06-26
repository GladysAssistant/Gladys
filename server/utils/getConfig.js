const config = require('../config/config');

module.exports = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env];
};
