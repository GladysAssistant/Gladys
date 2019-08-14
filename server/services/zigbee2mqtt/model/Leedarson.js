const { features } = require('../utils/features');

/**
 * Leedarson managed models.
 */
const Leedarson = {
  brand: 'Leedarson',
  models: {
    ZM350STW1TCF: [features.switch, features.brightness, features.color_temperature],
    M350STW1: [features.switch, features.brightness],
    'A806S-Q1R': [features.switch, features.brightness],
  },
};

module.exports = {
  Leedarson,
};
