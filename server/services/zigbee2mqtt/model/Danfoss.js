const { features } = require('../utils/features');

/**
 * Danfoss managed models.
 */
const Danfoss = {
  brand: 'Danfoss',
  models: {
    '014G2461': [features.temperature],
  },
};

module.exports = {
  Danfoss,
};
