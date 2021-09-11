const { features } = require('../utils/features');

/**
 * iLightsIn managed models.
 */
const ILightsIn = {
  brand: 'iLightsIn',
  models: {
    HLC610: [features.brightness, features.light],
  },
};

module.exports = {
  ILightsIn,
};
