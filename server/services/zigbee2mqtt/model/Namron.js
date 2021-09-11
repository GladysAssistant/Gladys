const { features } = require('../utils/features');

/**
 * Namron managed models.
 */
const Namron = {
  brand: 'Namron',
  models: {
    '1402755': [features.brightness, features.light],
    '3802962': [features.brightness, features.color, features.color_temperature, features.light],
    '3802964': [features.brightness, features.color_temperature, features.light],
    '3802967': [features.brightness, features.color, features.color_temperature, features.light],
    '4512700': [features.brightness, features.light],
    '4512701': [features.button],
    '4512702': [features.button],
    '4512703': [features.button],
    '4512704': [features.switch],
    '4512705': [features.button],
    '4512706': [features.button],
    '4512719': [features.button],
    '4512721': [features.button],
    '4512726': [features.button, features.voltage],
    '4512729': [features.button],
    '89665': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Namron,
};
