const { features } = require('../utils/features');

/**
 * Ksentry Electronics managed models.
 */
const KsentryElectronics = {
  brand: 'Ksentry Electronics',
  models: {
    'KS-SM001': [features.switch_sensor],
  },
};

module.exports = {
  KsentryElectronics,
};
