const { features } = require('../utils/features');

/**
 * Blaupunkt managed models.
 */
const Blaupunkt = {
  brand: 'Blaupunkt',
  models: {
    'PSM-S1': [features.energy, features.power, features.switch],
    'SCM-S1': [features.door],
  },
};

module.exports = {
  Blaupunkt,
};
