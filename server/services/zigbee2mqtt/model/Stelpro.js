const { features } = require('../utils/features');

/**
 * Stelpro managed models.
 */
const Stelpro = {
  brand: 'Stelpro',
  models: {
    SMT402: [features.temperature],
    SMT402AD: [features.temperature],
    ST218: [features.temperature],
    STZB402: [features.temperature],
  },
};

module.exports = {
  Stelpro,
};
