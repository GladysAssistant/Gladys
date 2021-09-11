const { features } = require('../utils/features');

/**
 * Dresden Elektronik managed models.
 */
const DresdenElektronik = {
  brand: 'Dresden Elektronik',
  models: {
    Mega23M12: [features.brightness, features.color, features.color_temperature, features.light],
    'XVV-Mega23M12': [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  DresdenElektronik,
};
