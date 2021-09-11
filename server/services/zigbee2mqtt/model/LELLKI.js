const { features } = require('../utils/features');

/**
 * LELLKI managed models.
 */
const LELLKI = {
  brand: 'LELLKI',
  models: {
    CM001: [features.switch],
    'JZ-ZB-001': [features.switch],
    'JZ-ZB-002': [features.switch],
    'JZ-ZB-003': [features.switch],
    TS011F_plug: [features.current, features.energy, features.power, features.switch, features.voltage],
    'WP33-EU': [features.switch],
  },
};

module.exports = {
  LELLKI,
};
