const { features } = require('../utils/features');

/**
 * LivingWise managed models.
 */
const LivingWise = {
  brand: 'LivingWise',
  models: {
    'LVS-ZB500D': [features.light, features.brightness],
    'LVS-SM10ZW': [features.door],
  },
};

module.exports = {
  LivingWise,
};
