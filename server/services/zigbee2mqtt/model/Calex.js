const { features } = require('../utils/features');

/**
 * Calex managed models.
 */
const Calex = {
  brand: 'Calex',
  models: {
    '421786': [features.switch, features.brightness],
    '421792': [features.switch, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  Calex,
};
