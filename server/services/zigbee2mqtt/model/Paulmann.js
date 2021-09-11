const { features } = require('../utils/features');

/**
 * Paulmann managed models.
 */
const Paulmann = {
  brand: 'Paulmann',
  models: {
    '371000001': [features.brightness, features.color_temperature, features.light],
    '371000002': [features.brightness, features.color, features.color_temperature, features.light],
    '500.47': [features.brightness, features.color, features.color_temperature, features.light],
    '500.48': [features.brightness, features.light],
    '500.67': [features.button],
    '50043': [features.switch_sensor],
    '50044/50045': [features.brightness, features.light],
    '50049/500.63': [features.brightness, features.color, features.color_temperature, features.light],
    '50064': [features.brightness, features.color_temperature, features.light],
    '798.15': [features.brightness, features.light],
    '929.60': [features.brightness, features.light],
    '929.63': [features.brightness, features.color_temperature, features.light],
    '929.66': [features.brightness, features.color, features.color_temperature, features.light],
    '93999': [features.brightness, features.light],
  },
};

module.exports = {
  Paulmann,
};
