const logger = require('../../../../utils/logger');

/**
 * @description Getting Z-Wave status.
 * @returns {object} Return Object of status.
 * @example
 * zwave.getStatus();
 */
function getStatus() {
  logger.debug(`ZwaveJSUI : Getting status...`);

  return {
    ready: this.ready,

    scanInProgress: this.scanInProgress,

    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    mqttConnected: this.mqttConnected,

    zwaveJSUIExist: this.zwaveJSUIExist,
    zwaveJSUIRunning: this.zwaveJSUIRunning,
    zwaveJSUIConnected: this.zwaveJSUIConnected,
    usbConfigured: this.usbConfigured,

    dockerBased: this.dockerBased,
  };
}

module.exports = {
  getStatus,
};
