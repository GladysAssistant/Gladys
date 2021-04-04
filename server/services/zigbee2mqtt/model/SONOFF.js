const { features } = require('../utils/features');

/**
 * SONOFF managed models.
 */
const SONOFF = {
  brand: 'SONOFF',
  models: {
    'SNZB-01': [features.button],
    'SNZB-02': [features.temperature, features.humidity],
    'SNZB-03': [features.motion],
    'SNZB-04': [features.door],
  },
};

module.exports = {
  SONOFF,
};
