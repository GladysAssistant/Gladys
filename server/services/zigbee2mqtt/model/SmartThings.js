const { features } = require('../utils/features');

/**
 * SmartThings managed models.
 */
const SmartThings = {
  brand: 'SmartThings',
  models: {
    '3300-S': [features.door, features.temperature],
    '3305-S': [features.motion, features.temperature],
    '3310-S': [features.humidity, features.temperature],
    '3315-G': [features.temperature, features.water],
    '3315-S': [features.temperature, features.water],
    '3321-S': [features.door, features.temperature],
    '3325-S': [features.motion, features.temperature],
    '7ZA-A806ST-Q1R': [features.brightness, features.light],
    'F-ADT-WTR-1': [features.temperature, features.water],
    'F-APP-UK-V2': [features.current, features.power, features.switch_sensor, features.voltage],
    'F-MLT-US-2': [features.door, features.temperature],
    'GP-LBU019BBAWU': [features.brightness, features.light],
    'GP-WOU019BBDWG': [features.energy, features.power, features.switch_sensor],
    'IM6001-BTP01': [features.button, features.temperature],
    'IM6001-MPP01': [features.door, features.temperature],
    'IM6001-MTP01': [features.motion, features.temperature],
    'IM6001-OTP05': [features.switch_sensor],
    'IM6001-WLP01': [features.temperature, features.water],
    'STS-IRM-250': [features.motion, features.temperature],
    'STS-IRM-251': [features.motion, features.temperature],
    'STS-OUT-US-2': [features.current, features.power, features.switch_sensor, features.voltage],
    'STS-PRS-251': [features.button],
    'STS-WTR-250': [features.temperature, features.water],
    'STSS-IRM-001': [features.motion],
    'STSS-MULT-001': [features.door],
    // 'STSS-PRES-001': [],
    // 'SZ-SRN12N': [],
    'WTR-UK-V2': [features.temperature, features.water],
  },
};

module.exports = {
  SmartThings,
};
