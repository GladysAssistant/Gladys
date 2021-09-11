const { features } = require('../utils/features');

/**
 * Hive managed models.
 */
const Hive = {
  brand: 'Hive',
  models: {
    '1613V': [features.energy, features.power, features.switch, features.temperature],
    DWS003: [features.door, features.temperature],
    HALIGHTDIMWWB22: [features.brightness, features.light],
    HALIGHTDIMWWE14: [features.brightness, features.light],
    HALIGHTDIMWWE27: [features.brightness, features.light],
    'HV-CE14CXZB6': [features.brightness, features.color_temperature, features.light],
    'HV-GSCXZB229B': [features.brightness, features.color_temperature, features.light],
    'HV-GSCXZB269': [features.brightness, features.color_temperature, features.light],
    'HV-GSCXZB279_HV-GSCXZB229_HV-GSCXZB229K': [features.brightness, features.color_temperature, features.light],
    'HV-GUCXZB5': [features.brightness, features.color_temperature, features.light],
    KEYPAD001: [features.button, features.door, features.motion, features.voltage],
    MOT003: [features.motion, features.temperature],
    // SLB2: [],
    SLR1: [features.temperature],
    SLR1b: [features.temperature],
    SLR2: [features.temperature],
    SLR2b: [features.temperature],
    // SLT2: [],
    // SLT3: [],
    // SLT3B: [],
    UK7004240: [features.temperature],
    // WPT1: [],
  },
};

module.exports = {
  Hive,
};
