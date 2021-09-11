const { features } = require('../utils/features');

/**
 * Livolo managed models.
 */
const Livolo = {
  brand: 'Livolo',
  models: {
    TI0001: [features.switch],
    'TI0001-cover': [features.door],
    'TI0001-dimmer': [features.brightness, features.light],
    'TI0001-socket': [features.switch],
    'TI0001-switch': [features.switch],
    'TI0001-switch-2gang': [features.switch],
  },
};

module.exports = {
  Livolo,
};
