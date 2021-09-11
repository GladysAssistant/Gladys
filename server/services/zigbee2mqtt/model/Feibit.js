const { features } = require('../utils/features');

/**
 * Feibit managed models.
 */
const Feibit = {
  brand: 'Feibit',
  models: {
    SBM01ZB: [features.motion],
    SCA01ZB: [features.smoke],
    SDM01ZB: [features.door],
    // SEB01ZB: [],
    SFS01ZB: [features.switch_sensor],
    SGA01ZB: [features.smoke],
    SLS301ZB_2: [features.switch_sensor],
    SLS301ZB_3: [features.switch_sensor],
    SSA01ZB: [features.smoke],
    SSS401ZB: [features.button, features.switch_sensor],
    STH01ZB: [features.humidity, features.temperature],
    SWA01ZB: [features.water],
    'TZSW22FW-L4': [features.switch_sensor],
  },
};

module.exports = {
  Feibit,
};
