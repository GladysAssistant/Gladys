const { features } = require('../utils/features');

/**
 * GMY Smart Bulb managed models.
 */
const GMYSmartBulb = {
  brand: 'GMY Smart Bulb',
  models: {
    B07KG5KF5R: [features.switch, features.brightness, features.color_temperature],
  },
};

module.exports = {
  GMYSmartBulb,
};
