const { features } = require('../utils/features');

/**
 * Sercomm managed models.
 */
const Sercomm = {
  brand: 'Sercomm',
  models: {
    'SZ-ESW01-AU': [features.switch, features.power],
  },
};

module.exports = {
  Sercomm,
};
