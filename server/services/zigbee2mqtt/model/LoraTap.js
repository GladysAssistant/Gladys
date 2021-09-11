const { features } = require('../utils/features');

/**
 * LoraTap managed models.
 */
const LoraTap = {
  brand: 'LoraTap',
  models: {
    RR400ZB: [features.switch_sensor],
    SC400: [features.door],
    SS600ZB: [features.button],
  },
};

module.exports = {
  LoraTap,
};
