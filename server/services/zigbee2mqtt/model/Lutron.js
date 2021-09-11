const { features } = require('../utils/features');

/**
 * Lutron managed models.
 */
const Lutron = {
  brand: 'Lutron',
  models: {
    LZL4BWHL01: [features.button],
    'Z3-1BRL': [features.brightness, features.button],
  },
};

module.exports = {
  Lutron,
};
