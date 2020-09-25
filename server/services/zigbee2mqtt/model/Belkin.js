const { features } = require('../utils/features');

/**
 * Belkin managed models.
 */
const Belkin = {
  brand: 'Belkin',
  models: {
    F7C033: [features.switch, features.brightness],
  },
};

module.exports = {
  Belkin,
};
