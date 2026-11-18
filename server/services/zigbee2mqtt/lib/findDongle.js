const { findConfiguredPort, getStablePath, isSameAdapterFamily, listSerialPorts } = require('../utils/donglePorts');
const { findAdapter } = require('./getUsbPorts');

/**
 * @description Get the path to store for the configured USB dongle, found plugged in: the same one, or its
 * /dev/serial/by-id/ link when it was found under another link (by its serial number), or when its stored port is the
 * only dongle of the configured driver family plugged in (the migration of the installations stored by port: a port
 * shared with another USB-serial adapter, or with a second dongle of the same family, which took its number at this
 * start, keeps it).
 * @param {object} dongle - The dongle found, see findDongle.
 * @param {object} dongle.port - Its serial port.
 * @param {string} dongle.stablePath - Its /dev/serial/by-id/ link, or its port when it has none.
 * @param {Array} dongle.ports - All the serial ports plugged in.
 * @param {string} driverPath - Its stored path.
 * @param {string} dongleName - Configured coordinator model.
 * @returns {string} The path to store.
 * @example
 * const newDriverPath = getDriverPathToStore(dongle, '/dev/ttyUSB0', 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P');
 */
function getDriverPathToStore({ port, stablePath, ports }, driverPath, dongleName) {
  if (port.path === driverPath) {
    // Some NAS list a port twice, under the same path
    const sameFamilyPaths = new Set(
      ports.filter((usbPort) => isSameAdapterFamily(findAdapter(usbPort), dongleName)).map((usbPort) => usbPort.path),
    );
    return sameFamilyPaths.size === 1 && sameFamilyPaths.has(port.path) ? stablePath : driverPath;
  }
  // Found by its link: kept, even when the link cannot be checked from Gladys
  if (driverPath.endsWith(`/${port.pnpId}`)) {
    return driverPath;
  }
  return stablePath;
}

/**
 * @description Find the configured USB dongle among the serial ports plugged in.
 * @param {string} driverPath - Stored path of the dongle: /dev/ttyUSB0, or /dev/serial/by-id/<pnpId>.
 * @returns {Promise<object|null>} Its port, as listed by the serialport library, the path to store for it (see
 * getStablePath) and all the ports listed; null when it is not plugged in.
 * @example
 * const dongle = await this.findDongle('/dev/ttyUSB0');
 */
async function findDongle(driverPath) {
  const ports = await listSerialPorts(this.gladys);
  const port = await findConfiguredPort(ports, driverPath);
  if (!port) {
    return null;
  }
  return { port, stablePath: await getStablePath(port, ports), ports };
}

module.exports = {
  findDongle,
  getDriverPathToStore,
};
