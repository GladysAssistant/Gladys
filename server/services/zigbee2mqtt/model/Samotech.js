const { features } = require('../utils/features');

/**
 * Samotech managed models.
 */
const Samotech = {
  brand: 'Samotech',
  models: {
    SM301Z: [features.motion],
    SM308: [features.switch],
    SM309: [features.brightness, features.light],
    SM311: [features.brightness, features.current, features.energy, features.light, features.power, features.voltage],
    SM323: [features.brightness, features.light],
  },
};

module.exports = {
  Samotech,
};
