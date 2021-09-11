const { features } = require('../utils/features');

/**
 * Ecolink managed models.
 */
const Ecolink = {
  brand: 'Ecolink',
  models: {
    '4655BC0-R': [features.door, features.temperature],
  },
};

module.exports = {
  Ecolink,
};
