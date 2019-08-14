const { features } = require('../utils/features');

/**
 * Sylvania managed models.
 */
const Sylvania = {
  brand: 'Sylvania',
  models: {
    '73742': [features.switch, features.brightness, features.color_temperature],
    '73740': [features.switch, features.brightness, features.color_temperature],
    '73739': [features.switch, features.brightness, features.color_temperature], // color xy
    '73693': [features.switch, features.brightness, features.color_temperature], // color xy
    '74283': [features.switch, features.brightness],
    '74696': [features.switch, features.brightness],
    '72922-A': [features.switch],
    '71831': [features.switch, features.brightness, features.color_temperature],
    '74282': [features.switch, features.brightness, features.color_temperature],
    LTFY004: [features.switch, features.brightness], // color xy
    '74580': [features.switch, features.brightness],
  },
};

module.exports = {
  Sylvania,
};
