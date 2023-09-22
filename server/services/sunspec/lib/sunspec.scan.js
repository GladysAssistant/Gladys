const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { SCAN_OPTIONS } = require('./sunspec.constants');

/**
 * @description Scan for network devices.
 * @returns {Promise} The discovered devices.
 * @example
 * await lanManager.scan();
 */
async function scan() {
  if (this.scanning) {
    logger.warn(`Sunspec already scanning for devices...`);
    return [];
  }
  logger.info(`Sunspec starts scanning devices...`);

  this.scanning = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
    payload: {
      scanning: true,
    },
  });

  const enabledMasks = this.ipMasks.filter((mask) => mask.enabled).map(({ mask }) => mask);
  this.scanner = new this.ScannerClass(enabledMasks, '-p502');
  this.scanner.scanTimeout = SCAN_OPTIONS.SCAN_TIMEOUT;

  const scanDone = (discoveredDevices, success) => {
    this.scanning = false;
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
      payload: { scanning: false, success },
    });
  };

  const result = await new Promise((resolve) => {
    const onError = (err) => {
      if (err !== 'Scan cancelled') {
        logger.error('Sunspec fails to discover devices over network -', err);
      }
      scanDone([], false);
      return resolve([]);
    };

    const onSuccess = (foundDevices = []) => {
      const discoveredDevices = foundDevices.filter((device) => device.openPorts.length > 0);
      logger.info(`Sunspec discovers ${discoveredDevices.length} devices`);
      scanDone(discoveredDevices, true);
      return resolve(discoveredDevices);
    };

    this.scanner.on('error', onError);
    this.scanner.on('complete', onSuccess);
  });

  // this.stop();

  const uniqueResult = new Set();
  result.forEach((element) => {
    uniqueResult.add(element.ip);
  });
  return uniqueResult;
}

module.exports = {
  scan,
};
