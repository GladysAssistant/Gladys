const { features } = require('../utils/features');

/**
 * HEIMAN managed models.
 */
const HEIMAN = {
  brand: 'HEIMAN',
  models: {
    'HS1CA-M': [features.smoke],
    HS3MS: [features.presence],
    HS2SK: [features.switch, features.power],
    HS1SA: [features.smoke],
    HS3SA: [features.smoke],
    HS3CG: [features.smoke],
    'HS1DS/HS3DS': [features.door],
    'HEIMAN-M1': [features.door],
    'HS1DS-E': [features.door],
    'HS1WL/HS3WL': [features.water],
    'HS1-WL-E': [features.water],
    'HS1RC-M': [features.switch_sensor],
    'HS1CA-E': [features.smoke],
    'HS2WD-E': [features.siren],
  },
};

module.exports = {
  HEIMAN,
};
