const { features } = require('../utils/features');

/**
 * Leedarson managed models.
 */
const Lonsonho = {
  brand: 'Lonsonho',
  models: {
    'QS-Zigbee-D02-TRIAC-L': [features.light, features.brightness],
    'QS-Zigbee-D02-TRIAC-LN': [features.light, features.brightness],
  },
};

module.exports = {
  Lonsonho,
};
