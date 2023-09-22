const os = require('os');
const { CONFIGURATION, DEFAULT, SCAN_OPTIONS } = require('./sunspec.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { ModbusClient } = require('./utils/sunspec.ModbusClient');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.debug(`SunSpec: Connecting...`);

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

  const sunspecIps = await this.scan();

  const promises = [...sunspecIps].map(async (ip) => {
    const modbus = new ModbusClient(this.modbusClient);
    try {
      await modbus.connect(ip, DEFAULT.MODBUS_PORT);
      return modbus;
    } catch (e) {
      logger.error(e);
    }
    return null;
  });
  this.modbuses = await Promise.all(promises);

  this.connected = true;

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.CONNECTED,
  });

  logger.debug(`SunSpec: Searching devices...`);

  await this.scanNetwork();
}

module.exports = {
  connect,
};
