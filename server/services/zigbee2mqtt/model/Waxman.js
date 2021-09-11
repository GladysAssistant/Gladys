const { features } = require('../utils/features');

/**
 * Waxman managed models.
 */
const Waxman = {
  brand: 'Waxman',
  models: {
    '8840100H': [features.temperature, features.water],
  },
};

module.exports = {
  Waxman,
};
