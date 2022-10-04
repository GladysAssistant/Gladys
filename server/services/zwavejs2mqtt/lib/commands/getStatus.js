const logger = require('../../../../utils/logger');

/**
 * @description Getting Z-Wave status.
 * @returns {Object} Return Object of status.
 * @example
 * zwave.getStatus();
 */
function getStatus() {
  logger.debug(`Zwavejs2mqtt : Getting status...`);

  return {
    ready: this.ready,

    inclusionState: this.driver && this.driver.ready && this.driver.inclusionState,
    isHealNetworkActive: this.driver && this.driver.ready && this.driver.isHealNetworkActive,
    scanInProgress: this.scanInProgress,

    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    mqttConnected: this.mqttConnected,

    zwavejs2mqttExist: this.zwavejs2mqttExist,
    zwavejs2mqttRunning: this.zwavejs2mqttRunning,
    usbConfigured: this.usbConfigured,

    dockerBased: this.dockerBased,
  };
}

module.exports = {
  getStatus,
};
