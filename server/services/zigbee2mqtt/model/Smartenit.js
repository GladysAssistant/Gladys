const { features } = require('../utils/features');

/**
 * Smartenit managed models.
 */
const Smartenit = {
  brand: 'Smartenit',
  models: {
    '4040B': [features.energy, features.power, features.switch],
    'ZBHT-1': [features.humidity, features.temperature],
  },
};

module.exports = {
  Smartenit,
};
