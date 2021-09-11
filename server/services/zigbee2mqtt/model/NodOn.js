const { features } = require('../utils/features');

/**
 * NodOn managed models.
 */
const NodOn = {
  brand: 'NodOn',
  models: {
    'CWS-4-1-01_HUE': [features.button],
    'SIN-4-1-20': [features.switch],
    'SIN-4-2-20': [features.switch],
  },
};

module.exports = {
  NodOn,
};
