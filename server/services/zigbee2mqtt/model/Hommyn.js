const { features } = require('../utils/features');

/**
 * Hommyn managed models.
 */
const Hommyn = {
  brand: 'Hommyn',
  models: {
    'MS-20-Z': [features.motion],
    'WS-20-Z': [features.water],
  },
};

module.exports = {
  Hommyn,
};
