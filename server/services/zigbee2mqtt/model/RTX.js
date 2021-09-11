const { features } = require('../utils/features');

/**
 * RTX managed models.
 */
const RTX = {
  brand: 'RTX',
  models: {
    'ZB-RT1': [features.door, features.switch_sensor, features.temperature],
    ZVG1: [features.switch_sensor],
  },
};

module.exports = {
  RTX,
};
