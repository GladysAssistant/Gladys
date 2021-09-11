const { features } = require('../utils/features');

/**
 * Schwaiger managed models.
 */
const Schwaiger = {
  brand: 'Schwaiger',
  models: {
    HAL300: [features.brightness, features.color, features.color_temperature, features.light],
    HAL600: [features.brightness, features.light],
    'ZHS-15': [features.current, features.power, features.switch, features.voltage],
  },
};

module.exports = {
  Schwaiger,
};
