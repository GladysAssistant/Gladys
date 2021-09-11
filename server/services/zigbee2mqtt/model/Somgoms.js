const { features } = require('../utils/features');

/**
 * Somgoms managed models.
 */
const Somgoms = {
  brand: 'Somgoms',
  models: {
    'ZSQB-SMB-ZB': [features.switch],
    'ZSTY-SM-11ZG-US-W': [features.switch],
    'ZSTY-SM-1CTZG-US-W': [features.door],
    'ZSTY-SM-1DMZG-US-W': [features.brightness, features.light],
  },
};

module.exports = {
  Somgoms,
};
