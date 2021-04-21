const { features } = require('../utils/features');

/**
 * JIAWEN managed models.
 */
const JIAWEN = {
  brand: 'JIAWEN',
  models: {
    K2RGBW01: [features.light, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  JIAWEN,
};
