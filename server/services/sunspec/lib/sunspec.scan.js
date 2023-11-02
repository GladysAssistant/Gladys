const os = require('os');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { CONFIGURATION, SCAN_OPTIONS, DEFAULT } = require('./sunspec.constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

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

  const rawIPMasks = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_IP_MASKS, this.serviceId);
  if (rawIPMasks !== null) {
    const loadedIPMasks = JSON.parse(rawIPMasks);
    this.ipMasks = [];
    loadedIPMasks.forEach((option) => {
      const mask = { ...option, networkInterface: false };
      this.ipMasks.push(mask);
    });
  } else {
    throw new ServiceNotConfiguredError();
  }

  // Complete masks with network interfaces
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];

    interfaces.forEach((interfaceDetails) => {
      const { family, cidr: mask, internal } = interfaceDetails;

      // Filter on IP family
      if (SCAN_OPTIONS.IP_FAMILY.includes(family) && !internal) {
        const boundMask = this.ipMasks.find((currentMask) => currentMask.mask === mask);
        // Add not already bound masks
        if (!boundMask) {
          // Check subnet mask
          const subnetMask = mask.split('/')[1];
          // Default disable for large IP ranges (minimum value /24 to enable interface)
          const enabled = Number.parseInt(subnetMask, 10) >= 24;
          const networkInterfaceMask = {
            mask,
            name: interfaceName,
            networkInterface: true,
            enabled,
          };
          this.ipMasks.push(networkInterfaceMask);
        } else {
          // Force override with real information
          boundMask.name = interfaceName;
          boundMask.networkInterface = true;
        }
      }
    });
  });

  this.scanning = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
    payload: {
      scanning: true,
    },
  });

  const enabledMasks = this.ipMasks.filter((mask) => mask.enabled).map(({ mask }) => mask);
  this.scanner = new this.ScannerClass(enabledMasks, `-p${DEFAULT.MODBUS_PORT}`);
  this.scanner.scanTimeout = SCAN_OPTIONS.SCAN_TIMEOUT;

  const scanDone = (discoveredDevices, success) => {
    this.scanning = false;
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
      payload: {
        scanning: false,
        success,
      },
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
