const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
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
  const statusValue = statusMsg.Status.Power;
  const friendlyName = statusMsg.Status.FriendlyName[0];
  const moduleId = statusMsg.Status.Module;

  const model = models[moduleId];
  if (model) {
    sonoffHandler[deviceExternalId] = {
      name: friendlyName,
      external_id: `sonoff:${deviceExternalId}`,
      features: model.getFeatures(),
      model: model.getModel(),
      service_id: this.serviceId,
      should_poll: false,
    };

    events.push({
      device_feature_external_id: `sonoff:${deviceExternalId}:${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      state: statusValue,
    });
  } else {
    logger.warn(`MQTT : Sonoff model ${moduleId} (${friendlyName}) not managed`);
  }
}

module.exports = {
  status,
};
