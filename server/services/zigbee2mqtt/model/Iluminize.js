const { features } = require('../utils/features');

/**
 * Iluminize managed models.
 */
const Iluminize = {
  brand: 'Iluminize',
  models: {
    '511.000': [features.brightness, features.color, features.color_temperature, features.light],
    '511.010': [features.brightness, features.light],
    '511.012': [features.brightness, features.light],
    '511.040': [features.brightness, features.color, features.color_temperature, features.light],
    '511.050': [features.brightness, features.color, features.color_temperature, features.light],
    '511.10': [features.brightness, features.light],
    '511.201': [features.brightness, features.light],
    '511.202': [features.switch],
    '511.344': [features.button],
    '511.541': [features.button],
    '511.557': [features.button],
    '5120.1100': [features.brightness, features.light],
    '5120.1110': [features.brightness, features.light],
    '5120.1200': [features.switch],
    '5120.1210': [features.switch],
  },
};

module.exports = {
  Iluminize,
};
