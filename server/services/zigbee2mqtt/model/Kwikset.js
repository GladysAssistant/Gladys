const { features } = require('../utils/features');

/**
 * Kwikset managed models.
 */
const Kwikset = {
  brand: 'Kwikset',
  models: {
    '66492-001': [features.door],
    '99100-006': [features.door],
    '99100-045': [features.door],
    '99140-002': [features.door],
  },
};

module.exports = {
  Kwikset,
};
