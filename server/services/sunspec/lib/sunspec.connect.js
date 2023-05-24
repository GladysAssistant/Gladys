const { CONFIGURATION, DEFAULT } = require('./sunspec.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { ModbusClient } = require('./utils/sunspec.ModbusClient');
const logger = require('../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.debug(`SunSpec: Connecting...`);

  const sunspecUrl = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_DEVICE_URL, this.serviceId);
  if (!sunspecUrl) {
    throw new ServiceNotConfiguredError();
  }

  this.modbus = new ModbusClient(this.modbusClient);

  const [sunspecHost, sunspecPort = DEFAULT.MODBUS_PORT] = sunspecUrl.split(':');
  await this.modbus.connect(sunspecHost, sunspecPort);
  this.ready = true;
  this.connected = true;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.CONNECTED,
  });

  logger.debug(`SunSpec: Searching devices...`);

  await this.scanNetwork();

  logger.debug(`SunSpec: Starting devices scanning...`);

  this.scanDevicesInterval = setInterval(this.scanDevices, DEFAULT.SCAN_DEVICE_TIMEOUT);
}

module.exports = {
  connect,
};
