const { features } = require('../utils/features');

/**
 * KMPCIL managed models.
 */
const KMPCIL = {
  brand: 'KMPCIL',
  models: {
    KMPCIL_RES005: [
      features.humidity,
      features.illuminance,
      features.motion,
      features.pressure,
      features.switch_sensor,
      features.temperature,
    ],
  },
};

module.exports = {
  KMPCIL,
};
