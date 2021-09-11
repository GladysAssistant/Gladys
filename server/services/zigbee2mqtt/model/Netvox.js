const { features } = require('../utils/features');

/**
 * Netvox managed models.
 */
const Netvox = {
  brand: 'Netvox',
  models: {
    Z809A: [features.current, features.power, features.switch, features.voltage],
  },
};

module.exports = {
  Netvox,
};
