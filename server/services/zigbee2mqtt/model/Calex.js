const { features } = require('../utils/features');

/**
 * Calex managed models.
 */
const Calex = {
  brand: 'Calex',
  models: {
    '421786': [features.light, features.brightness],
    '421792': [features.light, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  Calex,
};
