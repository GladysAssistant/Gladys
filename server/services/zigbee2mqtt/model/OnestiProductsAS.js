const { features } = require('../utils/features');

/**
 * Onesti Products AS managed models.
 */
const OnestiProductsAS = {
  brand: 'Onesti Products AS',
  models: {
    'S4RX-110': [features.current, features.energy, features.power, features.switch, features.voltage],
    easyCodeTouch_v1: [features.door],
  },
};

module.exports = {
  OnestiProductsAS,
};
