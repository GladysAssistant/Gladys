const { features } = require('../utils/features');

/**
 * Trust managed models.
 */
const Trust = {
  brand: 'Trust',
  models: {
    'ZYCT-202': [features.switch_sensor],
    'ZLED-2709': [features.switch, features.brightness],
    'ZPIR-8000': [features.presence],
    'ZCTS-808': [features.door],
  },
};

module.exports = {
  Trust,
};
