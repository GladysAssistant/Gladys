const { features } = require('../utils/features');

/**
 * Gledopto managed models.
 */
const Gledopto = {
  brand: 'Gledopto',
  models: {
    'GL-C-008': [features.light, features.brightness, features.color_temperature, features.color],
    'GL-S-004Z': [features.light, features.brightness, features.color_temperature],
    'GL-C-006/GL-C-009': [features.light, features.brightness, features.color_temperature],
    'GL-S-007Z': [features.light, features.brightness, features.color_temperature],
    'GL-B-001Z': [features.light, features.brightness, features.color_temperature],
    'GL-G-001Z': [features.light, features.brightness, features.color_temperature, features.color],
    'GL-B-007Z': [features.light, features.brightness, features.color_temperature, features.color],
    'GL-B-008Z': [features.light, features.brightness, features.color_temperature, features.color],
    'GL-D-003Z': [features.light, features.brightness, features.color_temperature, features.color],
    'GL-S-003Z': [features.light, features.brightness, features.color_temperature, features.color],
    'GD-CZ-006': [features.light, features.brightness],
    'GL-FL-004TZ': [features.light, features.brightness, features.color_temperature, features.color],
  },
};

module.exports = {
  Gledopto,
};
