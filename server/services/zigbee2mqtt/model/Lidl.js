const { features } = require('../utils/features');

/**
 * Lidl managed models.
 */
const Lidl = {
  brand: 'Lidl',
  models: {
    HG06337: [features.switch],
    HG06104A: [features.light, features.brightness, features.color_temperature, features.color],
    HG06492C: [features.light, features.brightness, features.color_temperature],
    HG06492B: [features.light, features.brightness, features.color_temperature],
    HG06492A: [features.light, features.brightness, features.color_temperature],
    HG06106C: [features.light, features.brightness, features.color_temperature, features.color],
    HG06106A: [features.light, features.brightness, features.color_temperature, features.color],
    HG06106B: [features.light, features.brightness, features.color_temperature, features.color],
    '14147206L': [features.light, features.brightness, features.color_temperature, features.color],
    '14148906L': [features.light, features.brightness, features.color_temperature, features.color],
    '14149505L/14149506L': [features.light, features.brightness, features.color_temperature, features.color],
  },
};

module.exports = {
  Lidl,
};
