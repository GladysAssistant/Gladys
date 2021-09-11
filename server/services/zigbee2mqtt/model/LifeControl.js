const { features } = require('../utils/features');

/**
 * LifeControl managed models.
 */
const LifeControl = {
  brand: 'LifeControl',
  models: {
    'MCLH-02': [features.brightness, features.color, features.color_temperature, features.light],
    'MCLH-03': [features.current, features.power, features.switch_sensor, features.voltage],
    'MCLH-04': [features.door],
    'MCLH-05': [features.motion],
    'MCLH-07': [features.water],
    'MCLH-08': [features.humidity, features.temperature],
  },
};

module.exports = {
  LifeControl,
};
