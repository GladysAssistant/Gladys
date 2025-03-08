const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');
const { COMMANDCLASS } = require('./constants');

/**
 * @description Identify a more precise category if we can.
 * @param {object} exposed - An exposed feature found.
 * @param {object} zwaveNodeValue - The value received from zWave.
 * @example refineCategory([{name: '', feature: {category: 'general-sensor', ..}}], {id: 41, ...})
 */
function refineCategory(exposed, zwaveNodeValue) {
  const { commandClass } = zwaveNodeValue;

  if (
    commandClass === COMMANDCLASS.BINARY_SENSOR &&
    exposed.feature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR
  ) {
    const sensorType = zwaveNodeValue.ccSpecific?.sensorType ?? -1;
    switch (sensorType) {
      case 0x02:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR;
        break;
      case 0x03:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.CO_SENSOR;
        break;
      case 0x04:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.CO2_SENSOR;
        break;
      case 0x05:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR;
        break;
      case 0x06:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR;
        break;
      case 0x07:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR;
        break;
      case 0x0a:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR;
        break;
      case 0x0b:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
        break;
      case 0x0c:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
        break;
      default:
        break;
    }
  }

  if (
    commandClass === COMMANDCLASS.ALARM_SENSOR &&
    exposed.feature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR
  ) {
    const sensorType = zwaveNodeValue.ccSpecific?.sensorType ?? -1;
    switch (sensorType) {
      case 0x01:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR;
        break;
      case 0x02:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.CO_SENSOR;
        break;
      case 0x03:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.CO2_SENSOR;
        break;
      case 0x04:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR;
        break;
      case 0x05:
        exposed.feature.category = DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR;
        break;
      default:
        break;
    }
  }
}

module.exports = {
  refineCategory,
};
