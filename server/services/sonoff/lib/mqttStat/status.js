const logger = require('../../../../utils/logger');
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
  if (model) {
    const externalId = `sonoff:${deviceExternalId}`;
    const device = {
      name: friendlyName,
      external_id: externalId,
      features: model.getFeatures(externalId),
      model: model.getModel(),
      service_id: sonoffHandler.serviceId,
      should_poll: false,
    };

    sonoffHandler.mqttDevices[deviceExternalId] = device;
  } else {
    logger.warn(`MQTT : Sonoff model ${moduleId} (${friendlyName}) not managed`);
  }
}

module.exports = {
  status,
};
