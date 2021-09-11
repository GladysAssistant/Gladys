const { features } = require('../utils/features');

/**
 * KAMI managed models.
 */
const KAMI = {
  brand: 'KAMI',
  models: {
    N20: [features.door, features.motion],
  },
};

module.exports = {
  KAMI,
};
