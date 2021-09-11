const { features } = require('../utils/features');

/**
 * Livolo managed models.
 */
const Livolo = {
  brand: 'Livolo',
  models: {
    TI0001: [features.switch_sensor],
    'TI0001-cover': [features.door],
    'TI0001-dimmer': [features.brightness, features.light],
    'TI0001-socket': [features.switch_sensor],
    'TI0001-switch': [features.switch_sensor],
    'TI0001-switch-2gang': [features.switch_sensor],
  },
};

module.exports = {
  Livolo,
};
