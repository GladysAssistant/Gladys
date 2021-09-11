const { features } = require('../utils/features');

/**
 * CR Smart Home managed models.
 */
const CRSmartHome = {
  brand: 'CR Smart Home',
  models: {
    TS0001: [features.switch],
    TS0111: [features.switch],
    TS0202_CR: [features.motion],
    TS0203: [features.door],
    TS0204: [features.smoke],
    TS0205: [features.smoke],
    TS0207: [features.water],
    TS0218: [features.button],
  },
};

module.exports = {
  CRSmartHome,
};
