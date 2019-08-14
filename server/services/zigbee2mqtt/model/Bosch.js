const { features } = require('../utils/features');

/**
 * Bosch managed models.
 */
const Bosch = {
  brand: 'Bosch',
  models: {
    'RADON TriTech ZB': [features.temperature, features.presence],
    'ISW-ZPR1-WP13': [features.temperature, features.presence],
  },
};

module.exports = {
  Bosch,
};
