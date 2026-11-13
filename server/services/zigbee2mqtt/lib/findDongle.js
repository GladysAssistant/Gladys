const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { findConfiguredPort, getStablePath } = require('../utils/donglePorts');

/**
 * @description Find the configured USB dongle among the serial ports plugged in.
 * @param {string} driverPath - Stored path of the dongle: /dev/ttyUSB0, or /dev/serial/by-id/<pnpId>.
 * @returns {Promise<object|null>} Its port, as listed by the serialport library, and the path to store for it (see
 * getStablePath); null when it is not plugged in.
 * @example
 * const dongle = await this.findDongle('/dev/ttyUSB0');
 */
async function findDongle(driverPath) {
  const usb = this.gladys.service.getService('usb');
  // The usb service is not loaded when its serialport native module failed to load
  if (!usb) {
    throw new ServiceNotConfiguredError('USB service is not available');
  }
  const ports = await usb.list();
  const port = findConfiguredPort(ports, driverPath);
  if (!port) {
    return null;
  }
  return { port, stablePath: await getStablePath(port) };
}

module.exports = {
  findDongle,
};
