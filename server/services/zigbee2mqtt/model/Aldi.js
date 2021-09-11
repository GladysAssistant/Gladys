const { features } = require('../utils/features');

/**
 * Aldi managed models.
 */
const Aldi = {
  brand: 'Aldi',
  models: {
    '141L100RC': [features.button],
    'C422AC11D41H140.0W': [features.brightness, features.color, features.color_temperature, features.light],
    'C422AC14D41H140.0W': [features.brightness, features.color, features.color_temperature, features.light],
    'F122SB62H22A4.5W': [features.brightness, features.color_temperature, features.light],
    'L122AA63H11A6.5W': [features.brightness, features.color, features.color_temperature, features.light],
    'L122CB63H11A9.0W': [features.brightness, features.color, features.color_temperature, features.light],
    'L122FF63H11A5.0W': [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Aldi,
};
