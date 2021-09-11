const { features } = require('../utils/features');

/**
 * Prolight managed models.
 */
const Prolight = {
  brand: 'Prolight',
  models: {
    '5412748727388': [features.brightness, features.color, features.color_temperature, features.light],
    '5412748727401': [features.brightness, features.color, features.color_temperature, features.light],
    '5412748727432': [features.brightness, features.light],
  },
};

module.exports = {
  Prolight,
};
