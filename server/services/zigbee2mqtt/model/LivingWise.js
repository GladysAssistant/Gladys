const { features } = require('../utils/features');

/**
 * LivingWise managed models.
 */
const LivingWise = {
  brand: 'LivingWise',
  models: {
    'LVS-SC7': [features.button],
    'LVS-SM10ZW': [features.door],
    'LVS-SN10ZW_SN11': [features.motion],
    'LVS-ZB15R': [features.switch],
    'LVS-ZB15S': [features.switch],
    'LVS-ZB500D': [features.brightness, features.light],
  },
};

module.exports = {
  LivingWise,
};
