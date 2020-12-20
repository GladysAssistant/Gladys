const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

const { TP_LINK_EXTERNAL_ID_BASE, TP_LINK_IP_ADDRESS, TP_LINK_SERIAL_NUMBER } = require('../utils/consts');

const getTpLinkDevice = (device, deviceSysInfo, serviceId) => ({
  name: deviceSysInfo.alias,
  service_id: serviceId,
  external_id: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}`,
  selector: `${TP_LINK_EXTERNAL_ID_BASE}:${deviceSysInfo.deviceId}`,
  should_poll: true,
  model: deviceSysInfo.model,
  poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  features: [],
  not_handled: true,
  raw_tp_link_device: deviceSysInfo,
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
  getTpLinkDevice,
};
