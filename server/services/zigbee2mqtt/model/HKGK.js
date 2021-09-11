const { features } = require('../utils/features');

/**
 * HKGK managed models.
 */
const HKGK = {
  brand: 'HKGK',
  models: {
    'BAC-002-ALZB': [features.door, features.temperature],
  },
};

module.exports = {
  HKGK,
};
