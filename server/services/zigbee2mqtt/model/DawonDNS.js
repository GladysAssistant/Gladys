const { features } = require('../utils/features');

/**
 * Dawon DNS managed models.
 */
const DawonDNS = {
  brand: 'Dawon DNS',
  models: {
    'PM-B430-ZB': [features.energy, features.power, features.switch],
    'PM-B530-ZB': [features.energy, features.power, features.switch],
    'PM-B540-ZB': [features.energy, features.power, features.switch],
    'PM-C140-ZB': [features.energy, features.power, features.switch],
    'PM-C150-ZB': [features.energy, features.power, features.switch],
    'PM-S140-ZB': [features.switch],
    'PM-S140R-ZB': [features.switch],
    'PM-S150-ZB': [features.switch],
    'PM-S240-ZB': [features.switch],
    'PM-S240R-ZB': [features.switch],
    'PM-S250-ZB': [features.switch],
    'PM-S340-ZB': [features.switch],
    'PM-S340R-ZB': [features.switch],
    'PM-S350-ZB': [features.switch],
    'SG-V100-ZB': [features.switch],
  },
};

module.exports = {
  DawonDNS,
};
