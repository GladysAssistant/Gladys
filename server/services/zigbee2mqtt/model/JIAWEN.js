const { features } = require('../utils/features');

/**
 * JIAWEN managed models.
 */
const JIAWEN = {
  brand: 'JIAWEN',
  models: {
    'JW-A04-CT': [features.brightness, features.light],
    K2RGBW01: [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  JIAWEN,
};
