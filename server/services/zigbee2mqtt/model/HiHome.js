const { features } = require('../utils/features');

/**
 * HiHome managed models.
 */
const HiHome = {
  brand: 'HiHome',
  models: {
    'WZB-TRVL': [features.door, features.switch, features.temperature],
  },
};

module.exports = {
  HiHome,
};
