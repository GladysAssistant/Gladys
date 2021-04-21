const { features } = require('../utils/features');

/**
 * EcoSmart managed models.
 */
const EcoSmart = {
  brand: 'EcoSmart',
  models: {
    D1821: [features.light, features.brightness, features.color_temperature], // color xy
    D1531: [features.light, features.brightness],
    D1532: [features.light, features.brightness],
    D1542: [features.light, features.brightness, features.color_temperature],
  },
};

module.exports = {
  EcoSmart,
};
