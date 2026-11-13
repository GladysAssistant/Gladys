const fs = require('fs');

const { CONFIG_KEYS, ADAPTERS_BY_CONFIG_KEY } = require('../adapters');

// Links created by udev for each USB serial device, named after it: they follow the device from a port to another
const BY_ID_DIR = '/dev/serial/by-id/';

// A serial number this short is often shared by a whole series (0001 on cheap USB-serial chips): it does not tell one
// device from another
const MIN_SERIAL_NUMBER_LENGTH = 8;

/**
 * @description Find the serial port of the configured USB dongle: the port at this path, or the device of this
 * /dev/serial/by-id/ link, or else the only device with the same serial number and interface (a link renamed).
 * @param {Array} ports - Serial ports, as listed by the serialport library.
 * @param {string} driverPath - Stored path of the dongle: /dev/ttyUSB0, or /dev/serial/by-id/<pnpId>.
 * @returns {object|null} The port, or null when the dongle is not plugged in.
 * @example
 * const port = findConfiguredPort(ports, '/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1-if00-port0');
 */
function findConfiguredPort(ports, driverPath) {
  if (!driverPath) {
    return null;
  }
  const port = ports.find(({ path }) => path === driverPath);
  if (port || !driverPath.startsWith(BY_ID_DIR)) {
    return port || null;
  }
  const linkName = driverPath.slice(BY_ID_DIR.length);
  const linkedPort = ports.find(({ pnpId }) => pnpId === linkName);
  if (linkedPort) {
    return linkedPort;
  }
  // udev names the link usb-<vendor>_<product>_<serial number>-if<interface>[-port<n>]
  const interfaceMatch = linkName.match(/-if\d+(-port\d+)?$/);
  if (!interfaceMatch) {
    return null;
  }
  const [interfaceSuffix] = interfaceMatch;
  const sameSerialPorts = ports.filter(
    ({ pnpId, serialNumber }) =>
      pnpId &&
      serialNumber &&
      serialNumber.length >= MIN_SERIAL_NUMBER_LENGTH &&
      pnpId.endsWith(interfaceSuffix) &&
      linkName.endsWith(`_${serialNumber}${interfaceSuffix}`),
  );
  return sameSerialPorts.length === 1 ? sameSerialPorts[0] : null;
}

/**
 * @description Get the path to store for a serial port: its /dev/serial/by-id/ link, which Docker follows each time
 * it starts the Zigbee2mqtt container, so the dongle is found again after it moved to another port; else its path.
 * @param {object} port - Serial port, as listed by the serialport library.
 * @param {string} port.path - Path of the port, /dev/ttyUSB0.
 * @param {string} [port.pnpId] - USB device name, the name of its /dev/serial/by-id/ link.
 * @returns {Promise<string>} The link, when it exists, or the path of the port.
 * @example
 * const driverPath = await getStablePath({ path: '/dev/ttyUSB0', pnpId: 'usb-Silicon_Labs_CP2102N_1-if00-port0' });
 */
async function getStablePath({ path, pnpId }) {
  if (!pnpId) {
    return path;
  }
  const link = `${BY_ID_DIR}${pnpId}`;
  try {
    // Listed from the database of udev, the link is also on the disk of the host, unless /dev is not shared with Gladys
    await fs.promises.access(link);
    return link;
  } catch (e) {
    return path;
  }
}

/**
 * @description Get the driver family of a coordinator model: its Zigbee2mqtt adapter type, ember and ezsp being two
 * drivers of the same Silicon Labs chips (a dongle switched to ezsp by the fallback stays the same dongle).
 * @param {string} model - Coordinator model of the Gladys list.
 * @returns {string|null} The family, or null for a model out of the list.
 * @example
 * const family = getAdapterFamily('SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P');
 */
function getAdapterFamily(model) {
  const configKey = Object.values(CONFIG_KEYS).find((key) => ADAPTERS_BY_CONFIG_KEY[key].includes(model));
  if (!configKey) {
    return null;
  }
  return configKey === CONFIG_KEYS.EZSP ? CONFIG_KEYS.EMBER : configKey;
}

/**
 * @description Tell whether two coordinator models use the same driver family.
 * @param {string} model - Coordinator model of the Gladys list.
 * @param {string} otherModel - Another one.
 * @returns {boolean} True when both are in the list, of the same family.
 * @example
 * isSameAdapterFamily('ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"', 'SONOFF Dongle-M');
 */
function isSameAdapterFamily(model, otherModel) {
  const family = getAdapterFamily(model);
  return family !== null && family === getAdapterFamily(otherModel);
}

module.exports = {
  BY_ID_DIR,
  findConfiguredPort,
  getStablePath,
  isSameAdapterFamily,
};
