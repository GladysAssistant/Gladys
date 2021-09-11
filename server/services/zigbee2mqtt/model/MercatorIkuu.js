const { features } = require('../utils/features');

/**
 * Mercator ikuü managed models.
 */
const MercatorIkuu = {
  brand: 'Mercator ikuü',
  models: {
    SISWD01: [features.brightness, features.light],
    SMA02P: [features.motion],
    'SMD4106W-RGB-ZB': [features.brightness, features.color, features.color_temperature, features.light],
    SMI7040: [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  MercatorIkuu,
};
