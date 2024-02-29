const logger = require('../../../utils/logger');

/**
 * @description This will discovery Z-Wave JS UI devices.
 * @example zwaveJSUI.scan();
 */
function scan() {
  logger.info('Asking ZWave JS UI for the list of devices');
  this.publish('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes/set', 'true');
}

module.exports = {
  scan,
};
