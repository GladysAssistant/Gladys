const { features } = require('../utils/features');

/**
 * Siterwell managed models.
 */
const Siterwell = {
  brand: 'Siterwell',
  models: {
    'GS361A-H04': [features.door, features.switch, features.temperature],
  },
};

module.exports = {
  Siterwell,
};
