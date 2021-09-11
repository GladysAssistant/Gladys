const { features } = require('../utils/features');

/**
 * LELLKI managed models.
 */
const LELLKI = {
  brand: 'LELLKI',
  models: {
    CM001: [features.switch_sensor],
    'JZ-ZB-001': [features.switch_sensor],
    'JZ-ZB-002': [features.switch_sensor],
    'JZ-ZB-003': [features.switch_sensor],
    TS011F_plug: [features.current, features.energy, features.power, features.switch_sensor, features.voltage],
    'WP33-EU': [features.switch_sensor],
  },
};

module.exports = {
  LELLKI,
};
