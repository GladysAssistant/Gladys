const { features } = require('../utils/features');

/**
 * Viessmann managed models.
 */
const Viessmann = {
  brand: 'Viessmann',
  models: {
    ZK03840: [features.temperature],
  },
};

module.exports = {
  Viessmann,
};
