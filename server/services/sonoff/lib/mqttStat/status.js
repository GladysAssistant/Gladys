const models = require('../../models');

/**
 * @description Handle Tasmota 'stat/+/STATUS' topics.
 * @param {string} deviceExternalId - Device external id.
 * @param {string} message - MQTT message.
 * @param {Array} events - Resulting events.
 * @param {Object} sonoffHandler - Sonoff handler.
 * @example
 * status('sonoff:sonoff-plug', '{"key": "value"}', [], {});
 */
function status(deviceExternalId, message, events, sonoffHandler) {
  const statusMsg = JSON.parse(message);
  const friendlyName = statusMsg.Status.FriendlyName[0];
  const moduleId = statusMsg.Status.Module;

  const model = models[moduleId];
  const externalId = `sonoff:${deviceExternalId}`;
  const device = {
    name: friendlyName,
    external_id: externalId,
    features: [],
    model: moduleId,
    service_id: sonoffHandler.serviceId,
    should_poll: false,
  };

  if (model) {
    device.model = model.getModel();
    device.features = model.getFeatures(externalId);
  }

  sonoffHandler.mqttDevices[deviceExternalId] = device;
}

module.exports = {
  status,
};
