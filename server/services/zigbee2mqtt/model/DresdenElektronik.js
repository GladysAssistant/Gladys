const { features } = require('../utils/features');

/**
 * Dresden Elektronik managed models.
 */
const DresdenElektronik = {
  brand: 'Dresden Elektronik',
  models: {
    Mega23M12: [features.switch, features.brightness, features.color_temperature], // color xy
    'XVV-Mega23M12': [features.switch, features.brightness, features.color_temperature],
  },
};

module.exports = {
  DresdenElektronik,
};
