const { features } = require('../utils/features');

/**
 * Blaupunkt managed models.
 */
const Blaupunkt = {
  brand: 'Blaupunkt',
  models: {
    'SCM-S1': [features.door], // curtain / shutter
  },
};

module.exports = {
  Blaupunkt,
};
