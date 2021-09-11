const { features } = require('../utils/features');

/**
 * ROBB managed models.
 */
const ROBB = {
  brand: 'ROBB',
  models: {
    'ROB_200-003-0': [features.switch_sensor],
    'ROB_200-004-0': [features.brightness, features.light],
    'ROB_200-006-0': [features.brightness, features.light],
    'ROB_200-007-0': [features.button],
    'ROB_200-008-0': [features.button],
    'ROB_200-009-0': [features.button],
    'ROB_200-010-0': [features.door],
    'ROB_200-011-0': [features.brightness, features.light],
    'ROB_200-014-0': [features.brightness, features.light],
    'ROB_200-017-0': [features.current, features.energy, features.power, features.switch_sensor, features.voltage],
    'ROB_200-018-0': [features.button],
  },
};

module.exports = {
  ROBB,
};
