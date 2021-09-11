const { features } = require('../utils/features');

/**
 * LEDVANCE managed models.
 */
const LEDVANCE = {
  brand: 'LEDVANCE',
  models: {
    '4058075173989': [features.brightness, features.color_temperature, features.light],
    '4058075181472': [features.brightness, features.color_temperature, features.light],
    '4058075208339': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075208353': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075208360': [features.brightness, features.color, features.color_temperature, features.light],
    '4058075208414': [features.brightness, features.color_temperature, features.light],
    '4058075208421': [features.brightness, features.light],
    '4058075485174': [features.brightness, features.color_temperature, features.light],
    AB3257001NJ: [features.switch],
    AC08560: [features.brightness, features.color, features.color_temperature, features.light],
    AC10691: [features.switch],
    AC25697: [features.brightness, features.color, features.color_temperature, features.light],
    AC25702: [features.brightness, features.color_temperature, features.light],
    AC25704: [features.brightness, features.color_temperature, features.light],
    'AC26940/AC31266': [features.switch],
    GPDRPLOP401100CE: [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  LEDVANCE,
};
