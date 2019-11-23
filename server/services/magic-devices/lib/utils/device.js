const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES
} = require('../../../../utils/constants');

const { SERVICE_SELECTOR } = require('../utils/constants');

function createDevice(scannedDevice, serviceId) {

  const macAdress = scannedDevice.id;
  const id = `${SERVICE_SELECTOR}:${macAdress}`;

  const binaryFeatureId = `${id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`;
  const colorFeatureId = `${id}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`;
  const warmWhiteFeatureId = `${id}:${DEVICE_FEATURE_TYPES.LIGHT.WARM_WHITE}`;
  const coldWhiteFeatureId = `${id}:${DEVICE_FEATURE_TYPES.LIGHT.COLD_WHITE}`;
  const brightnessFeatureId = `${id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`;

  console.log('\tCreating Device with id ' + id);

  return {
    name: scannedDevice.model,
    service_id: serviceId,
    external_id: id,
    selector: id,
    model: scannedDevice.model,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS,
    features: [
      {
        name: "On/Off",              
        read_only: false,              
        keep_history: false,
        has_feedback: false,
        external_id: binaryFeatureId,
        selector: binaryFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        min: 0,
        max: 1
      },
      {
        name: "Color",
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: colorFeatureId,
        selector: colorFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        min: 0,
        max: 0
      },
      {
        name: "Warm White",
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: warmWhiteFeatureId,
        selector: warmWhiteFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,        
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100
      },
      {
        name: "Cold White",
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: coldWhiteFeatureId,
        selector: coldWhiteFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100
      }, 
      {
        name: "Brightness",
        read_only: false,
        keep_history: false,
        has_feedback: false,
        external_id: brightnessFeatureId,
        selector: brightnessFeatureId,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100
      },
    ],
    params: [
      {
        name: 'IP_ADDRESS',
        value: scannedDevice.address
      }
    ],
  }
}

module.exports = {
  createDevice
};