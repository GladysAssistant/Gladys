const { DEVICE_EXTERNAL_ID_BASE } = require('../utils/constants');

const getDevice = (device, serviceId) => {
  const modelName = device.model;
  const name = device.name || 'Yeelight';

  return {
    service_id: serviceId,
    name,
    model: modelName,
    external_id: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}`,
    selector: `${DEVICE_EXTERNAL_ID_BASE}:${device.id}`,
    should_poll: false,
    features: [],
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
    not_handled: true,
    raw_yeelight_device: device,
  };
};

module.exports = {
  getDevice,
};
