const { features } = require('../utils/features');

/**
 * Nanoleaf managed models.
 */
const Nanoleaf = {
  brand: 'Nanoleaf',
  models: {
    'NL08-0800': [features.switch, features.brightness],
  },
};

module.exports = {
  Nanoleaf,
};
