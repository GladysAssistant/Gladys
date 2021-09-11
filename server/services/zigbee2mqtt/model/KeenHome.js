const { features } = require('../utils/features');

/**
 * Keen Home managed models.
 */
const KeenHome = {
  brand: 'Keen Home',
  models: {
    // GW01: [],
    'RS-THP-MP-1.0': [features.humidity, features.pressure, features.temperature, features.voltage],
    SV01: [features.door, features.pressure, features.temperature],
    SV02: [features.door, features.pressure, features.temperature],
  },
};

module.exports = {
  KeenHome,
};
