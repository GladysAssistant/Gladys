const { features } = require('../utils/features');

/**
 * Leedarson managed models.
 */
const Leedarson = {
  brand: 'Leedarson',
  models: {
    ZM350STW1TCF: [features.light, features.brightness, features.color_temperature],
    M350STW1: [features.light, features.brightness],
    'A806S-Q1R': [features.light, features.brightness],
  },
};

module.exports = {
  Leedarson,
};
