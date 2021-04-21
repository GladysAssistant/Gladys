const { features } = require('../utils/features');

/**
 * Keen Home managed models.
 */
const KeenHome = {
  brand: 'Keen Home',
  models: {
    SV01: [features.door, features.temperature, features.pressure],
    SV02: [features.door, features.temperature, features.pressure],
  },
};

module.exports = {
  KeenHome,
};
