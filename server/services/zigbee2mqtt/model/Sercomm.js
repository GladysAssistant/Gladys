const { features } = require('../utils/features');

/**
 * Sercomm managed models.
 */
const Sercomm = {
  brand: 'Sercomm',
  models: {
    'AL-PIR02': [features.motion],
    'SZ-DWS04': [features.door, features.temperature],
    'SZ-DWS08': [features.door, features.temperature],
    'SZ-ESW01': [features.power, features.switch],
    'SZ-ESW01-AU': [features.power, features.switch],
    'XHS2-SE': [features.door, features.temperature],
  },
};

module.exports = {
  Sercomm,
};
