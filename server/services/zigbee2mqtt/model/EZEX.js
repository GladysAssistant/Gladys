const { features } = require('../utils/features');

/**
 * eZEX managed models.
 */
const EZEX = {
  brand: 'eZEX',
  models: {
    'ECW-100-A03': [features.switch_sensor],
  },
};

module.exports = {
  EZEX,
};
