const { features } = require('../utils/features');

/**
 * Enbrighten managed models.
 */
const Enbrighten = {
  brand: 'Enbrighten',
  models: {
    '43076': [features.switch],
    '43080': [features.brightness, features.light],
    '43082': [features.brightness, features.light],
    '43084': [features.switch],
    '43090': [features.brightness, features.light],
    '43100': [features.switch],
    '43102': [features.switch],
  },
};

module.exports = {
  Enbrighten,
};
