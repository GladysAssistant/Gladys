const { features } = require('../utils/features');

/**
 * Niviss managed models.
 */
const Niviss = {
  brand: 'Niviss',
  models: {
    'PS-ZIGBEE-SMART-CONTROLER-1CH-DIMMABLE': [features.brightness, features.light],
  },
};

module.exports = {
  Niviss,
};
