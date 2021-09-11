const { features } = require('../utils/features');

/**
 * M-ELEC managed models.
 */
const MELEC = {
  brand: 'M-ELEC',
  models: {
    'ML-ST-D200': [features.brightness, features.light],
  },
};

module.exports = {
  MELEC,
};
