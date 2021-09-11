const { features } = require('../utils/features');

/**
 * Wally managed models.
 */
const Wally = {
  brand: 'Wally',
  models: {
    'U02I007C.01': [features.button, features.door, features.humidity, features.temperature, features.water],
  },
};

module.exports = {
  Wally,
};
