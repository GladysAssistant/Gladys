const { features } = require('../utils/features');

/**
 * Securifi managed models.
 */
const Securifi = {
  brand: 'Securifi',
  models: {
    'PP-WHT-US': [features.switch, features.power, features.current, features.voltage],
  },
};

module.exports = {
  Securifi,
};
