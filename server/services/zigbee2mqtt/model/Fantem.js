const { features } = require('../utils/features');

/**
 * Fantem managed models.
 */
const Fantem = {
  brand: 'Fantem',
  models: {
    'ZB003-X': [features.humidity, features.illuminance, features.motion, features.temperature],
    'ZB006-X': [features.brightness, features.light],
  },
};

module.exports = {
  Fantem,
};
