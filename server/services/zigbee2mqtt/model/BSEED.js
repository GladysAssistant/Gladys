const { features } = require('../utils/features');

/**
 * BSEED managed models.
 */
const BSEED = {
  brand: 'BSEED',
  models: {
    TS0003: [features.switch_sensor],
  },
};

module.exports = {
  BSEED,
};
