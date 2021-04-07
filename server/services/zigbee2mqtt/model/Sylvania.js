const { features } = require('../utils/features');

/**
 * Sylvania managed models.
 */
const Sylvania = {
  brand: 'Sylvania',
  models: {
    '73742': [features.light, features.brightness, features.color_temperature],
    '73740': [features.light, features.brightness, features.color_temperature],
    '73739': [features.light, features.brightness, features.color_temperature], // color xy
    '73693': [features.light, features.brightness, features.color_temperature], // color xy
    '74283': [features.light, features.brightness],
    '74696': [features.light, features.brightness],
    '72922-A': [features.switch],
    '71831': [features.light, features.brightness, features.color_temperature],
    '74282': [features.light, features.brightness, features.color_temperature],
    LTFY004: [features.light, features.brightness], // color xy
    '74580': [features.light, features.brightness],
  },
};

module.exports = {
  Sylvania,
};
