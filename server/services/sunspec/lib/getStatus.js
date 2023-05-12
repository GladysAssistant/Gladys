const logger = require('../../../utils/logger');

/**
 * @description Getting SunSpec status.
 * @returns {object} Return Object of status.
 * @example
 * sunspec.getStatus();
 */
function getStatus() {
  logger.debug(`SunSpecJSUI : Getting status...`);

  return {
    ready: this.ready,

    scanInProgress: this.scanInProgress,

    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    mqttConnected: this.mqttConnected,

    sunspecJSUIExist: this.sunspecJSUIExist,
    sunspecJSUIRunning: this.sunspecJSUIRunning,
    sunspecJSUIConnected: this.sunspecJSUIConnected,
    usbConfigured: this.usbConfigured,

    dockerBased: this.dockerBased,
  };
}

module.exports = {
  getStatus,
};
