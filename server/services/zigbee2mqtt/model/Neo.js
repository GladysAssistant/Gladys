const { features } = require('../utils/features');

/**
 * Neo managed models.
 */
const Neo = {
  brand: 'Neo',
  models: {
    'NAS-AB02B0': [features.humidity, features.temperature],
    'NAS-WS02B0': [features.water],
  },
};

module.exports = {
  Neo,
};
