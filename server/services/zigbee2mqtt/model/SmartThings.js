const { features } = require('../utils/features');

/**
 * SmartThings managed models.
 */
const SmartThings = {
  brand: 'SmartThings',
  models: {
    'STSS-MULT-001': [features.door],
    'STS-PRS-251': [features.presence],
    '3325-S': [features.temperature, features.presence],
    '3321-S': [features.temperature, features.door],
    'IM6001-OTP05': [features.switch],
    'IM6001-MTP01': [features.temperature, features.presence],
    'STS-IRM-250': [features.temperature, features.presence],
    '3305-S': [features.temperature, features.presence],
    '3300-S': [features.temperature, features.door],
    'F-MLT-US-2': [features.temperature, features.door],
    'IM6001-MPP01': [features.temperature, features.door],
    '3310-S': [features.temperature],
    '3315-S': [features.temperature, features.water],
    '3315-G': [features.temperature, features.water],
    'IM6001-BTP01': [features.switch_sensor, features.temperature],
  },
};

module.exports = {
  SmartThings,
};
