const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { MODEL, REGISTER } = require('./sunspec.constants');
const { ModelFactory } = require('./utils/sunspec.ModelFactory');

/**
 * @description Scan SunSpec product Network.
 * @example
 * sunspec.scanNetwork();
 */
async function scanNetwork() {
  logger.debug(`SunSpec: Scanning network...`);

  const { manufacturer, product, swVersion, serialNumber } = ModelFactory.createModel(
    await this.modbus.readModel(MODEL.COMMON),
  );
  logger.info(
    `SunSpec: Found device ${manufacturer} ${product} with serial number ${serialNumber} and software version ${swVersion}`,
  );

  // SMA = N <> Fronius = N - 2
  const nbOfMPPT = (await this.modbus.readRegisterAsInt16(REGISTER.NB_OF_MPTT)) - (manufacturer === 'Fronius' ? 2 : 0);

  this.devices = [];
  for (let i = 0; i < nbOfMPPT; i += 1) {
    this.devices.push({
      manufacturer,
      product,
      serialNumber,
      swVersion,
      mppt: i + 1,
    });
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
  });
}

module.exports = {
  scanNetwork,
};
