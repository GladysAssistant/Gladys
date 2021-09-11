const { features } = require('../utils/features');

/**
 * Lidl managed models.
 */
const Lidl = {
  brand: 'Lidl',
  models: {
    '14147206L': [features.brightness, features.color_temperature, features.light],
    '14148906L': [features.brightness, features.color, features.color_temperature, features.light],
    '14149505L/14149506L': [features.brightness, features.color, features.color_temperature, features.light],
    'FB20-002': [features.button],
    HG06104A: [features.brightness, features.color, features.color_temperature, features.light],
    HG06106A: [features.brightness, features.color, features.color_temperature, features.light],
    HG06106B: [features.brightness, features.color, features.color_temperature, features.light],
    HG06106C: [features.brightness, features.color, features.color_temperature, features.light],
    HG06335: [features.motion],
    HG06336: [features.door],
    HG06337: [features.switch],
    HG06338: [features.switch],
    HG06462A: [features.brightness, features.light],
    HG06463A: [features.brightness, features.light],
    HG06467: [features.brightness, features.light],
    HG06492A: [features.brightness, features.color_temperature, features.light],
    HG06492B: [features.brightness, features.color_temperature, features.light],
    HG06492C: [features.brightness, features.color_temperature, features.light],
    HG06668: [features.button],
    'PSBZS A1': [features.switch],
  },
};

module.exports = {
  Lidl,
};
