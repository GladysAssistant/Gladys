const { features } = require('../utils/features');

/**
 * Eaton/Halo LED managed models.
 */
const EatonHaloLED = {
  brand: 'Eaton/Halo LED',
  models: {
    RL460WHZHA69: [features.brightness, features.color_temperature, features.light],
  },
};

module.exports = {
  EatonHaloLED,
};
