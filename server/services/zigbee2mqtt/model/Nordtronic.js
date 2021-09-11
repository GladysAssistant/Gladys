const { features } = require('../utils/features');

/**
 * Nordtronic managed models.
 */
const Nordtronic = {
  brand: 'Nordtronic',
  models: {
    '98423051': [features.switch_sensor],
    '98425031': [features.brightness, features.light],
  },
};

module.exports = {
  Nordtronic,
};
