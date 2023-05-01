const logger = require('../../../../utils/logger');

/**
 * @description Store discovered peripheral.
 * @param {object} broadlinkDevice - Broadlink device.
 * @example
 * await gladys.broadlink.addPeripheral({
 *  name: 'RM3 Pro Plus',
 *  ...
 * });
 */
async function addPeripheral(broadlinkDevice) {
  let connectable = true;
  try {
    await broadlinkDevice.auth();
  } catch (e) {
    const { model: name, mac: macArray } = broadlinkDevice;
    const mac = Buffer.from(macArray).toString('hex');
    logger.warn(`Broadlink fails to connect to ${name} (${mac}) device`, e);
    connectable = false;
  }

  const { model, mac: macArray, host = {} } = broadlinkDevice;
  const mac = Buffer.from(macArray).toString('hex');
  this.broadlinkDevices[mac] = broadlinkDevice;

  const peripheral = this.buildPeripheral(broadlinkDevice);
  if (peripheral && (peripheral.device || peripheral.canLearn)) {
    logger.info(`Broadlink discovers new peripheral: ${mac}`);

    const { address } = host;
    this.peripherals[mac] = { name: model, model, mac, address, connectable, ...peripheral };
  } else {
    logger.info(`Broadlink doesn't manager ${broadlinkDevice.module} peripheral`);
  }
}

module.exports = {
  addPeripheral,
};
