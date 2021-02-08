const { features } = require('../utils/features');

/**
 * TuYa managed models.
 */
const TuYa = {
  brand: 'TuYa',
  models: {
    // Lonsonho Tuya Smart Plug
    TS0121_plug: [features.switch, features.power, features.current, features.voltage],
  },
};

module.exports = {
  TuYa,
};
