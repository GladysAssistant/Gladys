const { features } = require('../utils/features');

/**
 * Sylvania managed models.
 */
const Sylvania = {
  brand: 'Sylvania',
  models: {
    '484719': [features.brightness, features.light],
    '71831': [features.brightness, features.color_temperature, features.light],
    '72567': [features.brightness, features.color_temperature, features.light],
    '72569': [features.brightness, features.color_temperature, features.light],
    '72922-A': [features.switch],
    '73693': [features.brightness, features.color, features.color_temperature, features.light],
    '73739': [features.brightness, features.color, features.color_temperature, features.light],
    '73740': [features.brightness, features.color_temperature, features.light],
    '73741': [features.brightness, features.color, features.color_temperature, features.light],
    '73742': [features.brightness, features.color_temperature, features.light],
    '73743': [features.button],
    '73773': [features.brightness, features.color, features.color_temperature, features.light],
    '73807': [features.brightness, features.light],
    '74282': [features.brightness, features.color_temperature, features.light],
    '74283': [features.brightness, features.light],
    '74388': [features.door, features.temperature],
    '74580': [features.brightness, features.light],
    '74696': [features.brightness, features.light],
    '75541': [features.brightness, features.color, features.color_temperature, features.light],
    LTFY004: [features.brightness, features.color, features.light],
  },
};

module.exports = {
  Sylvania,
};
