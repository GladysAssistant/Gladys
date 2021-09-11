const { features } = require('../utils/features');

/**
 * ETOP managed models.
 */
const ETOP = {
  brand: 'ETOP',
  models: {
    'HT-08': [features.door, features.temperature],
    'HT-10': [features.door, features.temperature],
  },
};

module.exports = {
  ETOP,
};
