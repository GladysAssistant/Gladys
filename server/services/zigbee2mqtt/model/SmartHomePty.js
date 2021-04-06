const { features } = require('../utils/features');

/**
 * Smart Home Pty managed models.
 */
const SmartHomePty = {
  brand: 'Smart Home Pty',
  models: {
    'HGZB-07A': [features.switch, features.color_temperature],
    'HGZB-20-DE': [features.switch],
  },
};

module.exports = {
  SmartHomePty,
};
