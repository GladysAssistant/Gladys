const { features } = require('../utils/features');

/**
 * GS managed models.
 */
const GS = {
  brand: 'GS',
  models: {
    'BDHM8E27W70-I1': [features.brightness, features.color_temperature, features.light],
    'BRHM8E27W70-I1': [features.brightness, features.color, features.light],
    'SSHM-I1': [features.smoke],
  },
};

module.exports = {
  GS,
};
