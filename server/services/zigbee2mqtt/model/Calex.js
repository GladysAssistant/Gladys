const { features } = require('../utils/features');

/**
 * Calex managed models.
 */
const Calex = {
  brand: 'Calex',
  models: {
    '421782': [features.button],
    '421786': [features.brightness, features.light],
    '421792': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Calex,
};
