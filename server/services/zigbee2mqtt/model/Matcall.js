const { features } = require('../utils/features');

/**
 * Matcall managed models.
 */
const Matcall = {
  brand: 'Matcall',
  models: {
    ZG401224: [features.brightness, features.light],
    ZG430700: [features.brightness, features.light],
  },
};

module.exports = {
  Matcall,
};
