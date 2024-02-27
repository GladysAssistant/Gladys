const logger = require('../../../../utils/logger');

/**
 * @description Post delete : if mqtt, unsubscribe.
 * @param {object} device - The deleted device.
 * @example
 * postDelete(device)
 */
function postDelete(device) {
  logger.debug(`Post delete of ${device.external_id}`);
  const mqttService = this.gladys.service.getService('mqtt');
  const topic = `nuki/${device.external_id.split(':')[1]}/#`;
  // Subscribe to Nuki device topics
  mqttService.device.unsubscribe(topic);
}

module.exports = {
  postDelete,
};
