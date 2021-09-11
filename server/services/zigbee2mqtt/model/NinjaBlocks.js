const { features } = require('../utils/features');

/**
 * Ninja Blocks managed models.
 */
const NinjaBlocks = {
  brand: 'Ninja Blocks',
  models: {
    Z809AF: [features.energy, features.power, features.switch],
  },
};

module.exports = {
  NinjaBlocks,
};
