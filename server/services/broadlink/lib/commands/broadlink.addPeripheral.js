const logger = require('../../../../utils/logger');

/**
 * @description Store discovered peripheral.
 * @param {Object} broadlinkDevice - Broadlink device.
 * @example
 * await gladys.broadlink.addPeripheral({
 *  name: 'RM3 Pro Plus',
 *  ...
 * });
 */
async function addPeripheral(broadlinkDevice) {
  try {
    await broadlinkDevice.auth();
  } catch (e) {
    const { model: name, mac: macArray } = broadlinkDevice;
    const mac = Buffer.from(macArray).toString('hex');
    logger.error(`Broadlink fails to connect to ${name} (${mac}) device`, e);
    return;
  }

  const { model: name, mac: macArray, host = {} } = broadlinkDevice;
  const mac = Buffer.from(macArray).toString('hex');
  this.broadlinkDevices[mac] = broadlinkDevice;

  const peripheral = this.buildPeripheral(broadlinkDevice);
  if (peripheral && (peripheral.device || peripheral.canLearn)) {
    logger.info(`Broadlink discovers new peripheral: ${mac}`);

    const { address } = host;
    this.peripherals[mac] = { name, mac, address, ...peripheral };
  } else {
    logger.info(`Broadlink doesn't manager ${broadlinkDevice.module} peripheral`);
  }
}

module.exports = {
  addPeripheral,
};
