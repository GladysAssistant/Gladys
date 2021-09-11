const { features } = require('../utils/features');

/**
 * Essentials managed models.
 */
const Essentials = {
  brand: 'Essentials',
  models: {
    '120112': [features.door, features.switch, features.temperature],
  },
};

module.exports = {
  Essentials,
};
