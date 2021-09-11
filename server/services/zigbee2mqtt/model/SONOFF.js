const { features } = require('../utils/features');

/**
 * SONOFF managed models.
 */
const SONOFF = {
  brand: 'SONOFF',
  models: {
    BASICZBR3: [features.switch],
    S31ZB: [features.switch],
    'SNZB-01': [features.button],
    'SNZB-02': [features.humidity, features.temperature, features.voltage],
    'SNZB-03': [features.motion],
    'SNZB-04': [features.door, features.voltage],
    ZBMINI: [features.switch],
  },
};

module.exports = {
  SONOFF,
};
