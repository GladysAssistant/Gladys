const { features } = require('../utils/features');

/**
 * HORNBACH managed models.
 */
const HORNBACH = {
  brand: 'HORNBACH',
  models: {
    '10011722': [features.brightness, features.color_temperature, features.light],
    '10011723': [features.brightness, features.color_temperature, features.light],
    '10011724': [features.brightness, features.color_temperature, features.light],
    '10011725': [features.brightness, features.color, features.color_temperature, features.light],
    '10297665': [features.brightness, features.color_temperature, features.light],
    '10297666': [features.brightness, features.color, features.color_temperature, features.light],
    '10297667': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  HORNBACH,
};
