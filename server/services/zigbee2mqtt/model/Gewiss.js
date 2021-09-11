const { features } = require('../utils/features');

/**
 * Gewiss managed models.
 */
const Gewiss = {
  brand: 'Gewiss',
  models: {
    GWA1521: [features.switch],
    GWA1522: [features.switch],
    GWA1531: [features.door],
  },
};

module.exports = {
  Gewiss,
};
