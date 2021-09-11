const { features } = require('../utils/features');

/**
 * PEQ managed models.
 */
const PEQ = {
  brand: 'PEQ',
  models: {
    '3300-P': [features.door, features.temperature],
  },
};

module.exports = {
  PEQ,
};
