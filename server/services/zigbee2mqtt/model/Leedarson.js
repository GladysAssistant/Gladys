const { features } = require('../utils/features');

/**
 * Leedarson managed models.
 */
const Leedarson = {
  brand: 'Leedarson',
  models: {
    '5AA-SS-ZA-H0': [features.illuminance, features.motion],
    '6ARCZABZH': [features.button],
    '6xy-M350ST-W1Z': [features.brightness, features.color_temperature, features.light],
    'A806S-Q1G': [features.brightness, features.color, features.color_temperature, features.light],
    'A806S-Q1R': [features.brightness, features.light],
    M350STW1: [features.brightness, features.light],
    ZA806SQ1TCF: [features.brightness, features.color_temperature, features.light],
    ZM350STW1TCF: [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  Leedarson,
};
