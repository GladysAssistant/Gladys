const { features } = require('../utils/features');

/**
 * Zipato managed models.
 */
const Zipato = {
  brand: 'Zipato',
  models: {
    'rgbw2.zbee27': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Zipato,
};
