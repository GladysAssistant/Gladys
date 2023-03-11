const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

/**
 * @description Scan for network devices.
 * @returns {Promise} The discovered devices.
 * @example
 * await lanManager.scan();
 */
async function scan() {
  if (!this.configured) {
    throw new ServiceNotConfiguredError();
  } else if (this.scanning) {
    logger.warn(`LANManager already scanning for devices...`);
    return [];
  } else {
    logger.info(`LANManager starts scanning devices...`);
    this.stop();

    this.scanning = true;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: this.getStatus(),
    });

    const result = await new Promise((resolve) => {
      const onError = (err) => {
        if (err !== 'Scan cancelled') {
          logger.error('LANManager fails to discover devices over network -', err);
        }
        return resolve([]);
      };

      const onSuccess = (foundDevices = []) => {
        this.discoveredDevices = foundDevices.filter((device) => device.mac);
        logger.info(`LANManager discovers ${this.discoveredDevices.length} devices`);
        return resolve(this.discoveredDevices);
      };

      const enabledMasks = this.ipMasks.filter((mask) => mask.enabled).map(({ mask }) => mask);
      this.scanner = new this.ScannerClass(enabledMasks, '-sn -R');
      this.scanner.on('error', onError);
      this.scanner.on('complete', onSuccess);
    });

    this.stop();

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: this.getStatus(),
    });

    return result;
  }
}

module.exports = {
  scan,
};
