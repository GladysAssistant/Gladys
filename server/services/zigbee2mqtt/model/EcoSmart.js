const { features } = require('../utils/features');

/**
 * EcoSmart managed models.
 */
const EcoSmart = {
  brand: 'EcoSmart',
  models: {
    A9A19A60WESDZ02: [features.brightness, features.color_temperature, features.light],
    A9BR3065WESDZ02: [features.brightness, features.color_temperature, features.light],
    D1523: [features.brightness, features.light],
    D1531: [features.brightness, features.light],
    D1532: [features.brightness, features.light],
    D1533: [features.brightness, features.light],
    D1542: [features.brightness, features.color_temperature, features.light],
    D1821: [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  EcoSmart,
};
