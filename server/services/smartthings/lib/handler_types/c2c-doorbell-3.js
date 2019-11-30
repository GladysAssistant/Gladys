const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const c2cDoorbell3 = {
  value: 'c2c-doorbell-3',
  categories: {
    [DEVICE_FEATURE_CATEGORIES.BUTTON]: [DEVICE_FEATURE_TYPES.BUTTON.CLICK],
    [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: [DEVICE_FEATURE_TYPES.SENSOR.BINARY],
  },
};

module.exports = { c2cDoorbell3 };
