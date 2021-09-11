const { features } = require('../utils/features');

/**
 * TERNCY managed models.
 */
const TERNCY = {
  brand: 'TERNCY',
  models: {
    'TERNCY-DC01': [features.door, features.temperature],
    'TERNCY-LS01': [features.button, features.switch],
    'TERNCY-PP01': [features.button, features.illuminance, features.motion, features.temperature],
    'TERNCY-SD01': [features.button],
  },
};

module.exports = {
  TERNCY,
};
