const { features } = require('../utils/features');

/**
 * Bitron managed models.
 */
const Bitron = {
  brand: 'Bitron',
  models: {
    'AV2010/34': [features.switch_sensor],
    'AV2010/22': [features.presence],
    'AV2010/25': [features.switch, features.power],
    'AV2010/32': [features.switch_sensor], // features.heating],
  },
};

module.exports = {
  Bitron,
};
