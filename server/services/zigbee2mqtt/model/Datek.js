const { features } = require('../utils/features');

/**
 * Datek managed models.
 */
const Datek = {
  brand: 'Datek',
  models: {
    '0402946': [features.door],
    HBR2917E: [features.button, features.temperature],
    HLU2909K: [features.current, features.power, features.switch, features.temperature, features.voltage],
    HSE2905E: [features.current, features.energy, features.power, features.temperature, features.voltage],
    HSE2919E: [features.temperature, features.water],
  },
};

module.exports = {
  Datek,
};
