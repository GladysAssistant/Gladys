const { DEFAULT } = require('./sunspec.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { ModbusClient } = require('./utils/sunspec.ModbusClient');
const logger = require('../../../utils/logger');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  logger.debug(`SunSpec: Connecting...`);

  this.sunspecIps = await this.scan();

  const promises = [...this.sunspecIps].map(async (ip) => {
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
