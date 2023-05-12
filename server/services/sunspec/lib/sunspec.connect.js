const { CONFIGURATION, DEFAULT } = require('./sunspec.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { ModbusClient } = require('./utils/sunspec.ModbusClient');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  const sunspecUrl = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_DEVICE_URL, this.serviceId);
  if (!sunspecUrl) {
    throw new ServiceNotConfiguredError();
  }

  this.modbus = new ModbusClient(this.modbusClient);

  const [sunspecHost, sunspecPort = DEFAULT.MODBUS_PORT] = sunspecUrl.split(':');
  await this.modbus.connect(sunspecHost, sunspecPort);

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.CONNECTED,
  });

  this.scanNetwork();

  this.scanDevices();
}

module.exports = {
  connect,
};
