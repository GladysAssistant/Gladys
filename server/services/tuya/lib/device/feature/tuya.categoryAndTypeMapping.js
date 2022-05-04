const { DEVICE_FEATURE_CATEGORIES } = require('../../../../../utils/constants');

const CATEGORY_AND_TYPE_BY_CODE = {
  // Metering socket
  // aqcz
  // Socket
  cz: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: {},
  },
  // Battery Pack
  // dcb
  // Power Strip
  pc: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: {},
  },
};

module.exports = {
  CATEGORY_AND_TYPE_BY_CODE,
};
