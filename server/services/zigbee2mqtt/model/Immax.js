const { features } = require('../utils/features');

/**
 * Immax managed models.
 */
const Immax = {
  brand: 'Immax',
  models: {
    '07004D/07005L': [features.brightness, features.color, features.color_temperature, features.light],
    '07005B': [features.brightness, features.light],
    '07008L': [features.brightness, features.color, features.color_temperature, features.light],
    '07042L': [features.brightness, features.color_temperature, features.light],
    '07045L': [features.door],
    '07046L': [features.button],
    '07047L': [features.humidity, features.illuminance, features.motion, features.temperature],
    '07048L': [features.power, features.switch],
    '07073L': [features.brightness, features.color_temperature, features.light],
    '07088L': [features.brightness, features.light],
    '07089L': [features.brightness, features.color_temperature, features.light],
    '07115L': [features.brightness, features.color, features.color_temperature, features.light],
    '07703L': [features.door, features.temperature],
  },
};

module.exports = {
  Immax,
};
