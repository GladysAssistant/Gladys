const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/shutter
 */
const shutterType = {
  key: 'action.devices.types.SHUTTER',
  category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
};

module.exports = {
  shutterType,
};
