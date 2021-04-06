const { features } = require('../utils/features');

/**
 * Shenzhen Homa managed models.
 */
const ShenzhenHoma = {
  brand: 'Shenzhen Homa',
  models: {
    'HLD812-Z-SC': [features.switch, features.brightness],
    'HLC610-Z': [features.switch, features.brightness],
    'HLC821-Z-SC': [features.switch, features.brightness],
  },
};

module.exports = {
  ShenzhenHoma,
};
