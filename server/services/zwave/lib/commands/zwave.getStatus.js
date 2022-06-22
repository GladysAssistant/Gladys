const logger = require('../../../../utils/logger');

/**
 * @description Getting Z-Wave status.
 * @returns {Object} Return Object of status.
 * @example
 * zwave.getStatus();
 */
function getStatus() {
  logger.debug(`Zwave : Getting status...`);

  return {
    ready: this.ready,

    inclusionState:
      this.driver && this.driver.ready && this.driver.controller ? this.driver.controller.inclusionState : 'Not ready',
    isHealNetworkActive:
      this.driver && this.driver.ready && this.driver.controller
        ? this.driver.controller.isHealNetworkActive
        : 'Not ready',
    scanInProgress: this.scanInProgress,

    zwaveConnected: this.zwaveConnected,
    usbConfigured: this.usbConfigured,
    restartRequired: this.restartRequired,

    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    mqttConnected: this.mqttConnected,

    zwave2mqttExist: this.zwave2mqttExist,
    zwave2mqttRunning: this.zwave2mqttRunning,

    dockerBased: this.dockerBased,
  };
}

module.exports = {
  getStatus,
};
