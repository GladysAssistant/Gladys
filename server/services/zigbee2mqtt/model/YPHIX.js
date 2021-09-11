const { features } = require('../utils/features');

/**
 * YPHIX managed models.
 */
const YPHIX = {
  brand: 'YPHIX',
  models: {
    '50208695': [
      features.brightness,
      features.current,
      features.energy,
      features.light,
      features.power,
      features.voltage,
    ],
  },
};

module.exports = {
  YPHIX,
};
