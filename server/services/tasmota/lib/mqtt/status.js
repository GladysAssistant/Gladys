const { addSelector } = require('../../../../utils/addSelector');

/**
 * @description Handle Tasmota 'stat/+/STATUS' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {Object} serviceId - Service ID.
 * @example
 * status('tasmota:tasmota-plug', '{"key": "value"}', 'service-id');
 */
function status(deviceExternalId, message, serviceId) {
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
    service_id: serviceId,
    should_poll: false,
  };

  addSelector(device);

  return device;
}

module.exports = {
  status,
};
