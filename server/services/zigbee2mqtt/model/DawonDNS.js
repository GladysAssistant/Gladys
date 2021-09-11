const { features } = require('../utils/features');

/**
 * Dawon DNS managed models.
 */
const DawonDNS = {
  brand: 'Dawon DNS',
  models: {
    'PM-B430-ZB': [features.energy, features.power, features.switch_sensor],
    'PM-B530-ZB': [features.energy, features.power, features.switch_sensor],
    'PM-B540-ZB': [features.energy, features.power, features.switch_sensor],
    'PM-C140-ZB': [features.energy, features.power, features.switch_sensor],
    'PM-C150-ZB': [features.energy, features.power, features.switch_sensor],
    'PM-S140-ZB': [features.switch_sensor],
    'PM-S140R-ZB': [features.switch_sensor],
    'PM-S150-ZB': [features.switch_sensor],
    'PM-S240-ZB': [features.switch_sensor],
    'PM-S240R-ZB': [features.switch_sensor],
    'PM-S250-ZB': [features.switch_sensor],
    'PM-S340-ZB': [features.switch_sensor],
    'PM-S340R-ZB': [features.switch_sensor],
    'PM-S350-ZB': [features.switch_sensor],
    'SG-V100-ZB': [features.switch_sensor],
  },
};

module.exports = {
  DawonDNS,
};
