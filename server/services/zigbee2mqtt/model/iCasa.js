const { features } = require('../utils/features');

/**
 * iCasa managed models.
 */
const iCasa = {
  brand: 'iCasa',
  models: {
    'ICZB-IW11D': [features.switch, features.brightness],
  },
};

module.exports = {
  iCasa,
};
