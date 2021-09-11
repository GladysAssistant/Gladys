const { features } = require('../utils/features');

/**
 * ORVIBO managed models.
 */
const ORVIBO = {
  brand: 'ORVIBO',
  models: {
    AM25: [features.door],
    CR11S8UZ: [features.button],
    R11W2Z: [features.switch_sensor],
    R20W2Z: [features.switch_sensor],
    RL804CZB: [features.brightness, features.color, features.color_temperature, features.light],
    RL804QZB: [features.switch_sensor],
    SE21: [features.button],
    SM10ZW: [features.door],
    SN10ZW: [features.motion],
    ST20: [features.humidity, features.temperature],
    ST21: [features.humidity, features.temperature],
    ST30: [features.humidity, features.temperature],
    SW21: [features.water],
    SW30: [features.water],
    T18W3Z: [features.switch_sensor],
    T21W1Z: [features.switch_sensor],
    T21W2Z: [features.switch_sensor],
    T30W3Z: [features.switch_sensor],
    W40CZ: [features.door],
  },
};

module.exports = {
  ORVIBO,
};
