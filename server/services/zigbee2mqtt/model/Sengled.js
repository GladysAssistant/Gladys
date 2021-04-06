const { features } = require('../utils/features');

/**
 * Sengled managed models.
 */
const Sengled = {
  brand: 'Sengled',
  models: {
    'E11-G13': [features.light, features.brightness],
    'E11-G23/E11-G33': [features.light, features.brightness],
    'Z01-CIA19NAE26': [features.light, features.brightness],
    'Z01-A19NAE26': [features.light, features.brightness, features.color_temperature],
    'E11-N1EA': [features.light, features.brightness, features.color_temperature], // color xy
    'E12-N14': [features.light, features.brightness],
    E1ACA4ABE38A: [features.light, features.brightness],
  },
};

module.exports = {
  Sengled,
};
