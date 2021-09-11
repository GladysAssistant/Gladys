const { features } = require('../utils/features');

/**
 * Hama managed models.
 */
const Hama = {
  brand: 'Hama',
  models: {
    '00176592': [features.door, features.switch_sensor, features.temperature],
  },
};

module.exports = {
  Hama,
};
