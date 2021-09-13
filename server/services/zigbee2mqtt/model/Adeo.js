const { features } = require('../utils/features');

/**
 * Adeo managed models.
 */
const Adeo = {
  brand: 'Adeo',
  models: {
    '9CZA-A806ST-Q1A': [features.light, features.brightness, features.color_temperature, features.color],
    '9CZA-M350ST-Q1A': [features.light, features.brightness, features.color_temperature, features.color],
    '9CZA-G1521-Q1A': [features.light, features.brightness, features.color_temperature, features.color],
  },
};

module.exports = {
  Adeo,
};
