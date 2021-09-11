const { features } = require('../utils/features');

/**
 * Ferguson managed models.
 */
const Ferguson = {
  brand: 'Ferguson',
  models: {
    'TH-T_V14': [features.humidity, features.temperature],
  },
};

module.exports = {
  Ferguson,
};
