const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/tv
 */
const televisionType = {
  key: 'action.devices.types.TV',
  category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
};

module.exports = {
  televisionType,
};
