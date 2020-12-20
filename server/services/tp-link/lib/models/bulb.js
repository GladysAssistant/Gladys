const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

const { TP_LINK_EXTERNAL_ID_BASE, TP_LINK_IP_ADDRESS, TP_LINK_SERIAL_NUMBER } = require('../utils/consts');

const getTpLinkBulb = (device, deviceSysInfo, serviceId) => ({
  name: deviceSysInfo.alias,
  service_id: serviceId,
  external_id: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}`,
  selector: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}`,
  model: deviceSysInfo.model,
  should_poll: true,
  poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  features: [
    {
      name: `${deviceSysInfo.alias} On/Off`,
      read_only: false,
      has_feedback: false,
      external_id: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      selector: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      min: 0,
      max: 1,
    },
  ],
  params: [
    {
      name: TP_LINK_IP_ADDRESS,
      value: device.host,
    },
    {
      name: TP_LINK_SERIAL_NUMBER,
      value: deviceSysInfo.deviceId,
    },
  ],
});

module.exports = {
  getTpLinkBulb,
};
