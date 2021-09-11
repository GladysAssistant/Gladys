const { features } = require('../utils/features');

/**
 * Nyce managed models.
 */
const Nyce = {
  brand: 'Nyce',
  models: {
    'NCZ-3011-HA': [features.door],
    'NCZ-3041-HA': [features.humidity, features.motion, features.temperature],
    'NCZ-3043-HA': [features.humidity, features.motion, features.temperature],
    'NCZ-3045-HA': [features.humidity, features.motion, features.temperature],
  },
};

module.exports = {
  Nyce,
};
