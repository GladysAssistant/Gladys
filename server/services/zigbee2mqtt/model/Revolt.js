const { features } = require('../utils/features');

/**
 * Revolt managed models.
 */
const Revolt = {
  brand: 'Revolt',
  models: {
    'NX-4911': [features.door, features.switch_sensor, features.temperature],
  },
};

module.exports = {
  Revolt,
};
