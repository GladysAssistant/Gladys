const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/switch
 */
const switchType = {
  key: 'action.devices.types.SWITCH',
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
};

module.exports = {
  switchType,
};
