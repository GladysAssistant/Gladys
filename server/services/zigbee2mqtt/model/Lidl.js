const { features } = require('../utils/features');

/**
 * Lidl managed models.
 */
const Lidl = {
  brand: 'Lidl',
  models: {
    HG06337: [features.switch],
    HG06104A: [features.light, features.brightness, features.color_temperature], // color xy
    HG06492C: [features.light, features.brightness, features.color_temperature],
    HG06492B: [features.light, features.brightness, features.color_temperature],
    HG06492A: [features.light, features.brightness, features.color_temperature],
    HG06106C: [features.light, features.brightness, features.color_temperature], // color xy
    HG06106A: [features.light, features.brightness, features.color_temperature], // color xy
    HG06106B: [features.light, features.brightness, features.color_temperature], // color xy
    '14147206L': [features.light, features.brightness, features.color_temperature], // color xy
    '14148906L': [features.light, features.brightness, features.color_temperature], // color xy
    '14149505L/14149506L': [features.light, features.brightness, features.color_temperature], // color xy
  },
};

module.exports = {
  Lidl,
};
