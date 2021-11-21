const logger = require('../../../../utils/logger');

/**
 * @description When the Bluetooth state changes, starts or stops scanning.
 * @param {string} state - The new Bluetooth state (poweredOn or poweredOff).
 * @example
 * bluetooth.on('stateChange', this.stateChange);
 */
function stateChange(state) {
  logger.debug(`Bluetooth: state changes to ${state}`);
  switch (state) {
    case 'poweredOn':
      this.ready = true;
      this.initPresenceScanner();
      break;
    default:
      this.ready = false;
      this.scanning = false;
      this.discoveredDevices = {};
      this.stopScanPresence();
  }

  this.broadcastStatus();
}

module.exports = {
  stateChange,
};
