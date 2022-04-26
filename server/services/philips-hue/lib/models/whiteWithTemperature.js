const i18n = require('i18n');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

const { LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');

const getPhilipsHueWhiteTemperatureLight = (philipsHueLight, bridgeSerialNumber, serviceId) => ({
  name: philipsHueLight.name,
  service_id: serviceId,
  external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}`,
  selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}`,
  should_poll: true,
  model: philipsHueLight.modelid,
  poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  features: [
    {
      name: `${philipsHueLight.name} ${i18n.__('integrations.global.device.feature.onOff')}`,
      read_only: false,
      has_feedback: false,
      external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      min: 0,
      max: 1,
    },
    {
      name: `${philipsHueLight.name} ${i18n.__('integrations.global.device.feature.brightness')}`,
      read_only: false,
      has_feedback: false,
      external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
      selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      min: 0,
      max: 100,
    },
    {
      name: `${philipsHueLight.name} ${i18n.__('integrations.global.device.feature.temperature')}`,
      read_only: false,
      has_feedback: false,
      external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`,
      selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      min: philipsHueLight._data.capabilities.control.ct.min, // eslint-disable-line no-underscore-dangle
      max: philipsHueLight._data.capabilities.control.ct.max, // eslint-disable-line no-underscore-dangle
    },
  ],
});

module.exports = {
  getPhilipsHueWhiteTemperatureLight,
};
