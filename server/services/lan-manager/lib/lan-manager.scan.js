const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { TIMERS } = require('./lan-manager.constants');

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

    this.scanning = true;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: this.getStatus(),
    });

    const enabledMasks = this.ipMasks.filter((mask) => mask.enabled).map(({ mask }) => mask);
    this.scanner = new this.ScannerClass(enabledMasks, '-sn -R');
    this.scanner.scanTimeout = TIMERS.SCAN;

    const scanDone = (discoveredDevices, success) => {
      const nbDevices = discoveredDevices.length;
      let deviceChanged = false;
      if (nbDevices > 0) {
        deviceChanged = this.discoveredDevices.length !== nbDevices;
        // Filter unique MAC
        const filteredDevices = {};
        discoveredDevices.forEach((device) => {
          const { mac } = device;
          if (mac && mac.length > 0) {
            filteredDevices[mac] = device;
          }
        });
        this.discoveredDevices = Object.values(filteredDevices);
      }

      this.scanning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
        payload: { ...this.getStatus(), deviceChanged, success },
      });
    };

    const result = await new Promise((resolve) => {
      const onError = (err) => {
        const cancelled = err === 'Scan cancelled';
        if (!cancelled) {
          logger.error('LANManager fails to discover devices over network -', err);
        }
        scanDone([], cancelled);
        return resolve([]);
      };

      const onSuccess = (foundDevices = []) => {
        const discoveredDevices = foundDevices.filter((device) => device.mac);
        logger.info(`LANManager discovers ${discoveredDevices.length} devices`);
        scanDone(discoveredDevices, true);
        return resolve(discoveredDevices);
      };

      this.scanner.on('error', onError);
      this.scanner.on('complete', onSuccess);
    });

    this.stop();

    return result;
  }
}

module.exports = {
  scan,
};
