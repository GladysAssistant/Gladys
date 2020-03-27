const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { DEVICES_MODELS, DEVICE_EXTERNAL_ID_BASE } = require('../utils/constants');

const getDevice = (device, serviceId) => {
  const modelName = DEVICES_MODELS[device.model] || '';
  const name = device.name || modelName === '' ? 'Yeelight' : `Yeelight ${modelName}`;

  return {
    service_id: serviceId,
    name,
    model: modelName,
    external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}`,
    selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}`,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [
      {
        name: `${name} On/Off`,
        external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
        selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 1,
      },
      {
        name: `${name} Brightness`,
        external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
        selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        read_only: false,
        has_feedback: false,
        min: 1,
        max: 100,
      },
      {
        name: `${name} Color`,
        external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`,
        selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 0,
      },
    ],
    params: [
      {
        name: 'IP_ADDRESS',
        value: device.host,
      },
      {
        name: 'PORT_ADDRESS',
        value: device.port,
      },
    ],
  };
};

module.exports = {
  getDevice,
};
