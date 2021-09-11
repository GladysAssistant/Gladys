const { features } = require('../utils/features');

/**
 * Securifi managed models.
 */
const Securifi = {
  brand: 'Securifi',
  models: {
    B01M7Y8BP9: [features.button],
    'PP-WHT-US': [features.current, features.power, features.switch, features.voltage],
  },
};

module.exports = {
  Securifi,
};
