const { features } = require('../utils/features');

/**
 * Busch-Jaeger managed models.
 */
const BuschJaeger = {
  brand: 'Busch-Jaeger',
  models: {
    '6717-84': [features.switch],
    '6735/6736/6737': [features.button, features.switch],
  },
};

module.exports = {
  BuschJaeger,
};
