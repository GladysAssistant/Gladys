const { features } = require('../utils/features');

/**
 * AwoX managed models.
 */
const AwoX = {
  brand: 'AwoX',
  models: {
    '33943/33946': [features.brightness, features.color, features.color_temperature, features.light],
    '33944': [features.brightness, features.color, features.color_temperature, features.light],
    '33951/33948': [features.brightness, features.light],
    '33957': [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  AwoX,
};
