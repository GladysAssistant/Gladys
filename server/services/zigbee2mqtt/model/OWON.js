const { features } = require('../utils/features');

/**
 * OWON managed models.
 */
const OWON = {
  brand: 'OWON',
  models: {
    CB432: [features.energy, features.power, features.switch_sensor],
    'PIR313-E': [features.humidity, features.illuminance, features.motion, features.temperature],
    WSP404: [features.energy, features.power, features.switch_sensor],
  },
};

module.exports = {
  OWON,
};
