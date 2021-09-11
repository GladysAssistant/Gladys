const { features } = require('../utils/features');

/**
 * Müller Licht managed models.
 */
const MullerLicht = {
  brand: 'Müller Licht',
  models: {
    '404000/404005/404012': [features.brightness, features.color, features.color_temperature, features.light],
    '404001': [features.brightness, features.light],
    '404002': [features.button],
    '404006/404008/404004': [features.brightness, features.color_temperature, features.light],
    '404017': [features.switch_sensor],
    '404021': [features.switch_sensor],
    '404022': [features.button],
    '404023': [features.brightness, features.light],
    '404024': [features.brightness, features.color_temperature, features.light],
    '404028': [features.brightness, features.color, features.color_temperature, features.light],
    '404031': [features.brightness, features.color_temperature, features.light],
    '404036': [features.brightness, features.color, features.color_temperature, features.light],
    '404037': [features.brightness, features.color_temperature, features.light],
    '44435': [features.brightness, features.color, features.color_temperature, features.light],
    'MLI-404011': [features.button],
  },
};

module.exports = {
  MullerLicht,
};
