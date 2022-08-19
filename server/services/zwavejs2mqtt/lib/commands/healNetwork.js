const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { DEFAULT } = require('../constants');

/**
 * @description Heal Zwave network
 * @example
 * zwave.healNetwork();
 */
function healNetwork() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.debug(`Zwave : Heal network.`);

  this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/beginHealingNetwork/set`);
}

module.exports = {
  healNetwork,
};
