const { features } = require('../utils/features');

/**
 * Ubisys managed models.
 */
const Ubisys = {
  brand: 'Ubisys',
  models: {
    C4: [features.button],
    D1: [features.brightness, features.light, features.power],
    J1: [features.door, features.power],
    S1: [features.button, features.power, features.switch],
    'S1-R': [features.button, features.power, features.switch],
    S2: [features.button, features.power, features.switch],
  },
};

module.exports = {
  Ubisys,
};
