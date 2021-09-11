const { features } = require('../utils/features');

/**
 * MatSee Plus managed models.
 */
const MatSeePlus = {
  brand: 'MatSee Plus',
  models: {
    ATMS1602Z: [features.current, features.energy, features.power, features.switch_sensor, features.voltage],
  },
};

module.exports = {
  MatSeePlus,
};
