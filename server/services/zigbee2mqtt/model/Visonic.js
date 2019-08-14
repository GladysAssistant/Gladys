const { features } = require('../utils/features');

/**
 * Visonic managed models.
 */
const Visonic = {
  brand: 'Visonic',
  models: {
    'MCT-350 SMA': [features.door],
    'MCT-340 E': [features.door],
  },
};

module.exports = {
  Visonic,
};
