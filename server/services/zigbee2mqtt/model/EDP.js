const { features } = require('../utils/features');

/**
 * EDP managed models.
 */
const EDP = {
  brand: 'EDP',
  models: {
    'PLUG EDP RE:DY': [features.switch, features.power],
    'SWITCH EDP RE:DY': [features.switch],
  },
};

module.exports = {
  EDP,
};
