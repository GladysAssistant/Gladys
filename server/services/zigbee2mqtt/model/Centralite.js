const { features } = require('../utils/features');

/**
 * Centralite managed models.
 */
const Centralite = {
  brand: 'Centralite',
  models: {
    '3157100': [features.temperature],
    '3310-G': [features.humidity, features.temperature],
    '3323-G': [features.door, features.temperature],
    '3328-G': [features.motion, features.temperature],
    '3400-D': [features.button, features.motion, features.temperature],
    '3420-G': [features.brightness, features.light],
    '4200-C': [features.switch_sensor],
    '4256251-RZHAC': [features.current, features.power, features.switch_sensor, features.voltage],
    '4257050-RZHAC': [features.current, features.power, features.switch_sensor, features.voltage],
    '4257050-ZHAC': [features.brightness, features.current, features.light, features.power, features.voltage],
  },
};

module.exports = {
  Centralite,
};
