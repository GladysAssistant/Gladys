const { features } = require('../utils/features');

/**
 * Vimar managed models.
 */
const Vimar = {
  brand: 'Vimar',
  models: {
    '03906': [features.button],
    '14592.0': [features.switch],
    '14594': [features.door],
  },
};

module.exports = {
  Vimar,
};
