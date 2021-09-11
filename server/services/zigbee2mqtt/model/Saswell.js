const { features } = require('../utils/features');

/**
 * Saswell managed models.
 */
const Saswell = {
  brand: 'Saswell',
  models: {
    'SEA801-Zigbee/SEA802-Zigbee': [features.door, features.switch, features.temperature],
  },
};

module.exports = {
  Saswell,
};
