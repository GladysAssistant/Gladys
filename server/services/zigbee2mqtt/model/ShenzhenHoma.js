const { features } = require('../utils/features');

/**
 * Shenzhen Homa managed models.
 */
const ShenzhenHoma = {
  brand: 'Shenzhen Homa',
  models: {
    'HLC610-Z': [features.brightness, features.light],
    'HLC614-ZLL': [features.switch],
    'HLC821-Z-SC': [features.brightness, features.light],
    'HLC833-Z-SC': [features.brightness, features.light],
    'HLD503-Z-CT': [features.brightness, features.color_temperature, features.light],
    'HLD812-Z-SC': [features.brightness, features.light],
  },
};

module.exports = {
  ShenzhenHoma,
};
