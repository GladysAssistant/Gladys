const { features } = require('../utils/features');

/**
 * Ajax Online managed models.
 */
const AjaxOnline = {
  brand: 'Ajax Online',
  models: {
    AJ_ZB_GU10: [features.brightness, features.color, features.color_temperature, features.light],
    AJ_ZIGPROA60: [features.brightness, features.color, features.color_temperature, features.light],
    Aj_Zigbee_Led_Strip: [features.brightness, features.color, features.color_temperature, features.light],
  },
};

module.exports = {
  AjaxOnline,
};
