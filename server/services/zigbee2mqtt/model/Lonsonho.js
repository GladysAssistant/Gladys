const { features } = require('../utils/features');

/**
 * Leedarson managed models.
 */
const Lonsonho = {
  brand: 'Lonsonho',
  models: {
    'QS-Zigbee-D02-TRIAC-LN': [features.switch, features.brightness],
  },
};

module.exports = {
  Lonsonho,
};
