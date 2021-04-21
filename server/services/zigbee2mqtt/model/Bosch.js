const { features } = require('../utils/features');

/**
 * Bosch managed models.
 */
const Bosch = {
  brand: 'Bosch',
  models: {
    'RADON TriTech ZB': [features.temperature, features.motion],
    'ISW-ZPR1-WP13': [features.temperature, features.motion],
  },
};

module.exports = {
  Bosch,
};
