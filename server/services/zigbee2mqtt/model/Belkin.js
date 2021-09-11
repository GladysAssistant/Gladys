const { features } = require('../utils/features');

/**
 * Belkin managed models.
 */
const Belkin = {
  brand: 'Belkin',
  models: {
    F7C033: [features.brightness, features.light],
  },
};

module.exports = {
  Belkin,
};
