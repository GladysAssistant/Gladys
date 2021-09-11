const { features } = require('../utils/features');

/**
 * Busch-Jaeger managed models.
 */
const BuschJaeger = {
  brand: 'Busch-Jaeger',
  models: {
    '6717-84': [features.switch_sensor],
    '6735/6736/6737': [features.button, features.switch_sensor],
  },
};

module.exports = {
  BuschJaeger,
};
