const { features } = require('../utils/features');

/**
 * ADEO managed models.
 */
const ADEO = {
  brand: 'ADEO',
  models: {
    '9CZA-A806ST-Q1A': [features.brightness, features.color, features.color_temperature, features.light],
    '9CZA-A806ST-Q1Z': [features.brightness, features.color_temperature, features.light],
    '9CZA-G1521-Q1A': [features.brightness, features.color, features.color_temperature, features.light],
    '9CZA-M350ST-Q1A': [features.brightness, features.color, features.color_temperature, features.light],
    '9CZA-P470T-A1A': [features.brightness, features.color, features.color_temperature, features.light],
    'HR-C99C-Z-C045': [features.button],
    LDSENK02F: [features.energy, features.power, features.switch],
  },
};

module.exports = {
  ADEO,
};
