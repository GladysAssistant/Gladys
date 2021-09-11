const { features } = require('../utils/features');

/**
 * Plugwise managed models.
 */
const Plugwise = {
  brand: 'Plugwise',
  models: {
    '160-01': [features.energy, features.power, features.switch_sensor],
  },
};

module.exports = {
  Plugwise,
};
