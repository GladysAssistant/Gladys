const { features } = require('../utils/features');

/**
 * Airam managed models.
 */
const Airam = {
  brand: 'Airam',
  models: {
    '4713406': [features.brightness, features.light],
    '4713407': [features.brightness, features.light],
    'AIRAM-CTR.U': [features.button],
    'CTR.UBX': [features.button],
  },
};

module.exports = {
  Airam,
};
