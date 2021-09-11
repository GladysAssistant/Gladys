const { features } = require('../utils/features');

/**
 * Qmotion managed models.
 */
const Qmotion = {
  brand: 'Qmotion',
  models: {
    HDM40PV620: [features.door],
    'QZR-ZIG2400': [features.button],
  },
};

module.exports = {
  Qmotion,
};
