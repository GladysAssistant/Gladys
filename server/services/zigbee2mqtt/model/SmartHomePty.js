const { features } = require('../utils/features');

/**
 * Smart Home Pty managed models.
 */
const SmartHomePty = {
  brand: 'Smart Home Pty',
  models: {
    'HGZB-07A': [features.brightness, features.color, features.color_temperature, features.light],
    'HGZB-20-DE': [features.switch_sensor],
  },
};

module.exports = {
  SmartHomePty,
};
