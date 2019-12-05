const { features } = require('../utils/features');

/**
 * Nyce managed models.
 */
const Nyce = {
  brand: 'Nyce',
  models: {
    'NCZ-3011-HA': [features.temperature, features.motion, features.humidity],
    'NCZ-3043-HA': [features.temperature, features.motion],
    'NCZ-3041-HA': [features.temperature, features.motion],
    'NCZ-3045-HA': [features.temperature, features.motion],
  },
};

module.exports = {
  Nyce,
};
