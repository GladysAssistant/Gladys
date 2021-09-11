const { features } = require('../utils/features');

/**
 * UseeLink managed models.
 */
const UseeLink = {
  brand: 'UseeLink',
  models: {
    'SM-AZ713': [features.switch_sensor],
    'SM-SO306E/K/M': [features.switch_sensor],
    'SM-SO306EZ-10': [features.switch_sensor],
  },
};

module.exports = {
  UseeLink,
};
