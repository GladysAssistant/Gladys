const { features } = require('../utils/features');

/**
 * EDP managed models.
 */
const EDP = {
  brand: 'EDP',
  models: {
    'PLUG EDP RE:DY': [features.energy, features.power, features.switch_sensor],
    'SWITCH EDP RE:DY': [features.switch_sensor],
  },
};

module.exports = {
  EDP,
};
