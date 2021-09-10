const { features } = require('../utils/features');

/**
 * HEIMAN managed models.
 */
const HEIMAN = {
  brand: 'HEIMAN',
  models: {
    'HS1CA-M': [features.co2],
    HS3MS: [features.motion],
    HS2SK: [features.switch, features.power],
    HS1SA: [features.smoke],
    HS3SA: [features.smoke],
    HS3CG: [features.gas],
    'HS1DS/HS3DS': [features.door],
    'HEIMAN-M1': [features.door],
    'HS1DS-E': [features.door],
    'HS1WL/HS3WL': [features.water],
    'HS1-WL-E': [features.water],
    'HS1RC-M': [features.switch_sensor],
    'HS1CA-E': [features.co2],
  },
};

module.exports = {
  HEIMAN,
};
