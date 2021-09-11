const { features } = require('../utils/features');

/**
 * Miboxer managed models.
 */
const Miboxer = {
  brand: 'Miboxer',
  models: {
    FUT035Z: [features.brightness, features.color_temperature, features.light],
    FUT036Z: [features.brightness, features.light],
    FUT039Z: [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  Miboxer,
};
