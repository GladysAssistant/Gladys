const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Initialize Nuki service with dependencies.
 * @returns {any} Null.
 * @example
 * nuki.start();
 */
async function start() {
  logger.debug(`Nuki: Starting`);
  const { webOk, mqttOk } = await this.getStatus();
  if (!webOk && !mqttOk) {
    throw new ServiceNotConfiguredError('Not starting Nuki service, since neither Nuki Web API nor MQTT is configured');
  }
  Object.values(this.protocols).forEach((handler) => handler.connect());
  return null;
}

module.exports = {
  start,
};
