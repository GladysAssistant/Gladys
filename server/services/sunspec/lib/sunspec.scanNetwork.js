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

  this.devices = [];

  const promises = this.modbuses.map(async (modbus) => {
    const { manufacturer, product, swVersion, serialNumber } = ModelFactory.createModel(
      await modbus.readModel(MODEL.COMMON),
    );
    logger.info(
      `SunSpec: Found device ${manufacturer} ${product} with serial number ${serialNumber} and software version ${swVersion}`,
    );

    // SMA = N <> Fronius = N - 2
    const nbOfMPPT = (await modbus.readRegisterAsInt16(REGISTER.NB_OF_MPPT)) - (manufacturer === 'Fronius' ? 2 : 0);

    // AC device
    this.devices.push({
      manufacturer,
      product,
      serialNumber,
      swVersion,
      valueModel: modbus.getValueModel(),
      modbus,
    });

    // One par DC (MPPT) device
    for (let i = 0; i < nbOfMPPT; i += 1) {
      this.devices.push({
        manufacturer,
        product,
        serialNumber,
        swVersion,
        mppt: i + 1,
        modbus,
      });
    }
  });
  await Promise.all(promises);

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
  });
}

module.exports = {
  scanNetwork,
};
