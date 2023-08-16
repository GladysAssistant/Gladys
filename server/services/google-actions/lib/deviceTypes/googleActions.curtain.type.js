const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/curtain
 */
const curtainType = {
  key: 'action.devices.types.CURTAIN',
  category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
};

module.exports = {
  curtainType,
};
