const { features } = require('../utils/features');

/**
 * Niko managed models.
 */
const Niko = {
  brand: 'Niko',
  models: {
    '170-33505': [features.current, features.power, features.switch_sensor, features.voltage],
    '552-80401': [features.motion],
    '552-80699': [features.energy, features.power, features.switch_sensor],
    '91004': [features.button],
  },
};

module.exports = {
  Niko,
};
