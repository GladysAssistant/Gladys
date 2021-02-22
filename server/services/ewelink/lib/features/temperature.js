const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/externalId');

module.exports = {
  // Gladys feature
  generateFeature: (name, channel = 0) => {
    return {
      name: `${name} Temperature`,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      read_only: true,
      has_feedback: false,
      min: -100,
      max: 200,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };
  },
  pollTemperature: (eWeLinkDevice, feature) => {
    const { deviceId } = parseExternalId(feature.external_id);
    const currentTemperature = (eWeLinkDevice.params && eWeLinkDevice.params.currentTemperature) || false;
    // if the value is different from the value we have, save new state
    if (currentTemperature && feature.last_value !== currentTemperature) {
      logger.debug(`eWeLink: Polling device "${deviceId}", temperature new value = ${currentTemperature}`);
      return currentTemperature;
    }
    return null;
  },
};
