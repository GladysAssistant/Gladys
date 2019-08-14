const { features } = require('../utils/features');

/**
 * Müller Licht managed models.
 */
const MullerLicht = {
  brand: 'Müller Licht',
  models: {
    '404000/404005/404012': [features.switch, features.brightness, features.color_temperature], // color xy
    '404006/404008/404004': [features.switch, features.brightness, features.color_temperature],
    'MLI-404011': [features.switch_sensor],
  },
};

module.exports = {
  MullerLicht,
};
