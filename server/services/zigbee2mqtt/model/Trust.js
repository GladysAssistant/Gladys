const { features } = require('../utils/features');

/**
 * Trust managed models.
 */
const Trust = {
  brand: 'Trust',
  models: {
    'ZCTS-808': [features.door],
    'ZLED-2709': [features.brightness, features.light],
    'ZLED-RGB9': [features.brightness, features.color, features.color_temperature, features.light],
    'ZLED-TUNE9': [features.brightness, features.color_temperature, features.light],
    'ZPIR-8000': [features.motion],
    'ZWLD-100': [features.water],
    'ZYCT-202': [features.button],
  },
};

module.exports = {
  Trust,
};
