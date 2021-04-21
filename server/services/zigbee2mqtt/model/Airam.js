const { features } = require('../utils/features');

/**
 * Airam managed models.
 */
const Airam = {
  brand: 'Airam',
  models: {
    '4713407': [features.light, features.brightness],
    'AIRAM-CTR.U': [features.switch_sensor],
  },
};

module.exports = {
  Airam,
};
