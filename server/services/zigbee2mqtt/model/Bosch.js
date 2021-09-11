const { features } = require('../utils/features');

/**
 * Bosch managed models.
 */
const Bosch = {
  brand: 'Bosch',
  models: {
    'ISW-ZPR1-WP13': [features.motion, features.temperature],
    'RADON TriTech ZB': [features.illuminance, features.motion, features.temperature],
  },
};

module.exports = {
  Bosch,
};
