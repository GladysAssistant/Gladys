const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/light
 */
const lightType = {
  key: 'action.devices.types.LIGHT',
  category: DEVICE_FEATURE_CATEGORIES.LIGHT,
};

module.exports = {
  lightType,
};
