const { features } = require('../utils/features');

/**
 * Woox managed models.
 */
const Woox = {
  brand: 'Woox',
  models: {
    R7049: [features.smoke],
    R7054: [features.button],
    R7060: [features.switch_sensor],
    R9077: [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  Woox,
};
