const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

const { LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');

const getPlugOnOff = (philipsHueLight, bridgeSerialNumber, serviceId) => ({
  name: philipsHueLight.name,
  service_id: serviceId,
  external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}`,
  selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}`,
  should_poll: true,
  model: philipsHueLight.modelid,
  poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  features: [
    {
      name: `${philipsHueLight.name} On/Off`,
      read_only: false,
      has_feedback: false,
      external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeSerialNumber}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      min: 0,
      max: 1,
    },
  ],
});

module.exports = {
  getPlugOnOff,
};
