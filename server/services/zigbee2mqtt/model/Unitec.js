const { features } = require('../utils/features');

/**
 * Unitec managed models.
 */
const Unitec = {
  brand: 'Unitec',
  models: {
    '30946': [features.door, features.switch, features.temperature],
  },
};

module.exports = {
  Unitec,
};
