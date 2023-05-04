const { addSelector } = require('../../../../utils/addSelector');
const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../tasmota.constants');

/**
 * @description Handle Tasmota 'stat/+/STATUS' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @returns {object} Return device.
 * @example
 * status('tasmota:tasmota-plug', '{"key": "value"}', 'service-id');
 */
function status(deviceExternalId, message) {
  const statusMsg = JSON.parse(message);
  const friendlyName = statusMsg.Status.FriendlyName[0];
  const moduleId = statusMsg.Status.Module;

  const externalId = `tasmota:${deviceExternalId}`;
  const device = {
    name: friendlyName,
    external_id: externalId,
    selector: externalId,
    features: [],
    model: moduleId,
    service_id: this.tasmotaHandler.serviceId,
    should_poll: false,
    params: [
      {
        name: DEVICE_PARAM_NAME.PROTOCOL,
        value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT,
      },
    ],
  };

  addSelector(device);

  return device;
}

module.exports = {
  status,
};
