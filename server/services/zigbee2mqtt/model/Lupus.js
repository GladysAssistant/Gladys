const { features } = require('../utils/features');

/**
 * Lupus managed models.
 */
const Lupus = {
  brand: 'Lupus',
  models: {
    '12031': [features.switch], // curtain / shutter
    '12050': [features.switch, features.power],
  },
};

module.exports = {
  Lupus,
};
