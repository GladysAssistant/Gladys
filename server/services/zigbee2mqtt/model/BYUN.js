const { features } = require('../utils/features');

/**
 * BYUN managed models.
 */
const BYUN = {
  brand: 'BYUN',
  models: {
    'M415-5C': [features.smoke],
    'M415-6C': [features.smoke],
  },
};

module.exports = {
  BYUN,
};
