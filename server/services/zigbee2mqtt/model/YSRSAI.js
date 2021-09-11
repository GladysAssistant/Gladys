const { features } = require('../utils/features');

/**
 * YSRSAI managed models.
 */
const YSRSAI = {
  brand: 'YSRSAI',
  models: {
    'YSR-MINI-01_dimmer': [features.brightness, features.light],
    'YSR-MINI-01_rgbcct': [features.brightness, features.color, features.color_temperature, features.light],
    'YSR-MINI-01_wwcw': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  YSRSAI,
};
