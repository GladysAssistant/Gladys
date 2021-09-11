const { features } = require('../utils/features');

/**
 * UseeLink managed models.
 */
const UseeLink = {
  brand: 'UseeLink',
  models: {
    'SM-AZ713': [features.switch],
    'SM-SO306E/K/M': [features.switch],
    'SM-SO306EZ-10': [features.switch],
  },
};

module.exports = {
  UseeLink,
};
