const { features } = require('../utils/features');

/**
 * LED Trading managed models.
 */
const LEDTrading = {
  brand: 'LED Trading',
  models: {
    'HK-LN-DIM-A': [features.brightness, features.light],
  },
};

module.exports = {
  LEDTrading,
};
