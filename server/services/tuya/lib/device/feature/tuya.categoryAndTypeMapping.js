const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

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

  switch_1: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_2: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_3: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_4: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
};

module.exports = {
  CATEGORY_AND_TYPE_BY_CODE,
};
