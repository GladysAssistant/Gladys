const { features } = require('../utils/features');

/**
 * Livolo managed models.
 */
const Livolo = {
  brand: 'Livolo',
  models: {
    TI0001: [features.switch_sensor],
  },
};

module.exports = {
  Livolo,
};
