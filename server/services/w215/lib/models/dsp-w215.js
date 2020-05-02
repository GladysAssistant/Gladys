const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { W215_EXTERNAL_ID_BASE, W215_PIN_CODE } = require('../utils/constants');

/**
 * @description Create a DSP-W215 device for Gladys.
 * @param {string} serviceId - The UUID of the service.
 * @param {Object} device - The outlet device.
 * @returns {Object} Return TH device.
 * @example
 * getDevice(serviceId, device);
 */
function getDevice(serviceId, device) {
  
  return {
    service_id: serviceId,
    name: device.name,
    model: device.productModel || 'DSP-W215',
    external_id: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}`,
    selector: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}`,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: `On/Off`,
        external_id: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        selector: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 1,
      },
      {
        name: `Temperature`,
        external_id: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.TEMPERATURE}`,
        selector: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.TEMPERATURE}`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.TEMPERATURE,
        read_only: true,
        has_feedback: false,
        min: -20,
        max: 50,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        name: `Power`,
        external_id: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
        selector: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.POWER}`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 10000,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
      {
        name: `Energy`,
        external_id: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.ENERGY}`,
        selector: `${W215_EXTERNAL_ID_BASE}:${device.deviceid}:${DEVICE_FEATURE_TYPES.SWITCH.ENERGY}`,
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 1000000000,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      },
    ],
    params: [
      {
        name: W215_PIN_CODE,
        value: device.pin_code ? device.pin_code : 'See behind the outlet',
      },
    ],
  };
}

module.exports = {
  getDevice,
};
