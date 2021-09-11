const { features } = require('../utils/features');

/**
 * Larkkey managed models.
 */
const Larkkey = {
  brand: 'Larkkey',
  models: {
    PS080: [features.switch],
    PS580: [features.switch],
    'ZSTY-SM-1DMZG-EU': [features.brightness, features.light],
    'ZSTY-SM-1SRZG-EU': [features.door],
  },
};

module.exports = {
  Larkkey,
};
