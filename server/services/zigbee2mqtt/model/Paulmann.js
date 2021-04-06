const { features } = require('../utils/features');

/**
 * Paulmann managed models.
 */
const Paulmann = {
  brand: 'Paulmann',
  models: {
    '50043': [features.switch],
    '50045': [features.light, features.brightness],
    '50049': [features.light, features.brightness, features.color_temperature], // color xy
    '50064': [features.light, features.brightness, features.color_temperature],
  },
};

module.exports = {
  Paulmann,
};
