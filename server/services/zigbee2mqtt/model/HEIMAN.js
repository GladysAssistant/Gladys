const { features } = require('../utils/features');

/**
 * HEIMAN managed models.
 */
const HEIMAN = {
  brand: 'HEIMAN',
  models: {
    'HEIMAN-M1': [features.door],
    'HM1RC-2-E': [features.button],
    'HS1CA-E': [features.smoke],
    'HS1CA-M': [features.smoke],
    'HS1CG-E': [features.smoke],
    'HS1CG-E_3.0': [features.smoke],
    'HS1CG-M': [features.smoke],
    HS1CG_M: [features.smoke],
    HS1DS: [features.door],
    'HS1EB/HS1EB-E': [features.button],
    HS1HT: [features.humidity, features.temperature],
    'HS1HT-N': [features.humidity, features.temperature],
    'HS1MS-EF': [features.motion],
    'HS1MS-M': [features.motion],
    'HS1RC-EM': [features.button],
    'HS1RC-N': [features.button],
    HS1SA: [features.smoke],
    // 'HS1VS-EF': [],
    // 'HS1VS-N': [],
    'HS1WL/HS3WL': [features.water],
    'HS2AQ-EM': [features.humidity, features.temperature],
    'HS2CM-N-DC': [features.door],
    'HS2ESK-E': [features.current, features.power, features.switch_sensor, features.voltage],
    // HS2IRC: [],
    HS2SK: [features.current, features.power, features.switch_sensor, features.voltage],
    HS2SK_nxp: [features.current, features.power, features.switch_sensor, features.voltage],
    HS2SS: [features.button],
    'HS2SW1A/HS2SW1A-N': [features.switch_sensor],
    'HS2SW2A/HS2SW2A-N': [features.switch_sensor],
    'HS2SW3A/HS2SW3A-N': [features.switch_sensor],
    // 'HS2WD-E': [],
    HS3CG: [features.smoke],
    HS3DS: [features.door],
    HS3MS: [features.motion],
    HS3SA: [features.smoke],
    'SGMHM-I1': [features.smoke],
    'SKHMP30-I1': [features.current, features.power, features.switch_sensor, features.voltage],
    'SMHM-I1': [features.motion],
    'SOHM-I1': [features.door],
    'STHM-I1H': [features.humidity, features.temperature],
    'SWHM-I1': [features.water],
  },
};

module.exports = {
  HEIMAN,
};
