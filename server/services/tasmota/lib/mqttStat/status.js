const models = require('../../models');
const { addSelector } = require('../../../../utils/addSelector');

/**
 * @description Handle Tasmota 'stat/+/STATUS' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {Array} events - Resulting events.
 * @param {Object} tasmotaHandler - Tasmota handler.
 * @example
 * status('tasmota:tasmota-plug', '{"key": "value"}', [], {});
 */
function status(deviceExternalId, message, events, tasmotaHandler) {
  const statusMsg = JSON.parse(message);
  const friendlyName = statusMsg.Status.FriendlyName[0];
  const moduleId = statusMsg.Status.Module;

  const model = models[moduleId];
  const externalId = `tasmota:${deviceExternalId}`;
  const device = {
    name: friendlyName,
    external_id: externalId,
    selector: externalId,
    features: [],
    model: moduleId,
    service_id: tasmotaHandler.serviceId,
    should_poll: false,
  };

  addSelector(device);

  if (model) {
    device.model = model.getModel();
    device.features = model.getFeatures(externalId);
  }

  tasmotaHandler.mqttDevices[deviceExternalId] = device;
}

module.exports = {
  status,
};
