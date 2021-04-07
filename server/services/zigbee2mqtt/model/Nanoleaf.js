const { features } = require('../utils/features');

/**
 * Nanoleaf managed models.
 */
const Nanoleaf = {
  brand: 'Nanoleaf',
  models: {
    'NL08-0800': [features.light, features.brightness],
  },
};

module.exports = {
  Nanoleaf,
};
