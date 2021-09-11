const { features } = require('../utils/features');

/**
 * J.XUAN managed models.
 */
const JXUAN = {
  brand: 'J.XUAN',
  models: {
    DSZ01: [features.door],
    PRZ01: [features.motion],
    SPZ01: [features.power, features.switch_sensor],
    WSZ01: [features.button],
  },
};

module.exports = {
  JXUAN,
};
