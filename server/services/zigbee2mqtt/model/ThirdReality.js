const { features } = require('../utils/features');

/**
 * Third Reality managed models.
 */
const ThirdReality = {
  brand: 'Third Reality',
  models: {
    '3RDS17BZ': [features.door, features.voltage],
    '3RMS16BZ': [features.motion, features.voltage],
    '3RSL011Z': [features.brightness, features.color_temperature, features.light],
    '3RSL012Z': [features.brightness, features.color_temperature, features.light],
    '3RSS007Z': [features.switch_sensor],
    '3RSS008Z': [features.switch_sensor],
    '3RSS009Z': [features.switch_sensor, features.voltage],
    '3RWS18BZ': [features.voltage, features.water],
  },
};

module.exports = {
  ThirdReality,
};
