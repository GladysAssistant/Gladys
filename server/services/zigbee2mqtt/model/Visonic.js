const { features } = require('../utils/features');

/**
 * Visonic managed models.
 */
const Visonic = {
  brand: 'Visonic',
  models: {
    'MCT-340 E': [features.door, features.temperature],
    'MCT-340 SMA': [features.door, features.temperature],
    'MCT-350 SMA': [features.door],
    'MCT-370 SMA': [features.door],
    'MP-841': [features.motion],
  },
};

module.exports = {
  Visonic,
};
