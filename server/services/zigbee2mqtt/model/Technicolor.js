const { features } = require('../utils/features');

/**
 * Technicolor managed models.
 */
const Technicolor = {
  brand: 'Technicolor',
  models: {
    'XHK1-TC': [features.button, features.door, features.motion, features.temperature, features.voltage],
  },
};

module.exports = {
  Technicolor,
};
