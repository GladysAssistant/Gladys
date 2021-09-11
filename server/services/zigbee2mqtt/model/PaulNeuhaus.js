const { features } = require('../utils/features');

/**
 * Paul Neuhaus managed models.
 */
const PaulNeuhaus = {
  brand: 'Paul Neuhaus',
  models: {
    '100.001.96': [features.brightness, features.color, features.color_temperature, features.light],
    '100.075.74': [features.brightness, features.color, features.color_temperature, features.light],
    '100.110.51': [features.brightness, features.color_temperature, features.light],
    '100.425.90': [features.switch],
    '100.462.31': [features.button],
    '100.491.61': [features.brightness, features.color, features.color_temperature, features.light],
    'NLG-CCT light': [features.brightness, features.color_temperature, features.light],
    'NLG-RGB-TW light': [features.brightness, features.color, features.color_temperature, features.light],
    'NLG-RGBW light': [features.brightness, features.color, features.color_temperature, features.light],
    'NLG-RGBW_light': [features.brightness, features.color, features.color_temperature, features.light],
    'NLG-TW light': [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  PaulNeuhaus,
};
