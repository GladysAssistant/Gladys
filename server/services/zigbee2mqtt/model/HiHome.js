const { features } = require('../utils/features');

/**
 * HiHome managed models.
 */
const HiHome = {
  brand: 'HiHome',
  models: {
    'WZB-TRVL': [features.door, features.switch_sensor, features.temperature],
  },
};

module.exports = {
  HiHome,
};
