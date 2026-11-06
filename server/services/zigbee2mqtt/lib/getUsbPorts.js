const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { USB_FINGERPRINTS } = require('../adapters/usbFingerprints');

/**
 * @description Find the coordinator model of a serial port from its USB fingerprint.
 * @param {object} port - Serial port, as listed by the serialport library.
 * @param {string} [port.vendorId] - USB vendor id.
 * @param {string} [port.productId] - USB product id.
 * @param {string} [port.pnpId] - USB device name, the name of its /dev/serial/by-id/ link.
 * @returns {string|null} The model of the Gladys list, or null if not recognized.
 * @example
 * const adapter = findAdapter({ vendorId: '10c4', productId: 'ea60', pnpId: 'usb-ITead_Sonoff_Dongle_Plus_1-if00' });
 */
function findAdapter({ vendorId, productId, pnpId }) {
  if (!vendorId || !productId || !pnpId) {
    return null;
  }

  const fingerprint = USB_FINGERPRINTS.find(
    (entry) =>
      entry.vendorId === vendorId.toLowerCase() &&
      entry.productId === productId.toLowerCase() &&
      entry.pnpId.test(pnpId),
  );
  return fingerprint ? fingerprint.adapter : null;
}

/**
 * @description Build a readable name of the device plugged in a serial port, from its USB device name
 * (usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_<serial>-if00-port0 → Itead Sonoff Zigbee 3.0 USB Dongle Plus V2).
 * @param {object} port - Serial port, as listed by the serialport library.
 * @param {string} [port.pnpId] - USB device name, the name of its /dev/serial/by-id/ link.
 * @param {string} [port.serialNumber] - USB serial number.
 * @param {string} [port.manufacturer] - USB manufacturer.
 * @returns {string|null} The device name, or its manufacturer, or null if unknown.
 * @example
 * const name = getDeviceName({ pnpId: 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1-if00', serialNumber: '1' });
 */
function getDeviceName({ pnpId, serialNumber, manufacturer }) {
  if (!pnpId) {
    return manufacturer || null;
  }

  let name = pnpId.replace(/^usb-/, '').replace(/-if\d+(-port\d+)?$/, '');
  if (serialNumber && name.endsWith(`_${serialNumber}`)) {
    name = name.slice(0, -serialNumber.length - 1);
  }
  // udev replaces the spaces and special characters by underscores: zig-a-zig-ah! (zzh!) → zig-a-zig-ah__zzh_
  return name.replace(/_+/g, ' ').trim();
}

/**
 * @description List the serial ports of the machine, with the name of the device plugged in each, and the
 * coordinator model recognized from its USB fingerprint.
 * @returns {Promise<Array>} Serial ports: path, name, pnpId (USB device name, absent for the serial ports
 * of the machine itself), adapter (recognized model, or null).
 * @example
 * const ports = await this.getUsbPorts();
 */
async function getUsbPorts() {
  const usb = this.gladys.service.getService('usb');
  // The usb service is not loaded when its serialport native module failed to load
  if (!usb) {
    throw new ServiceNotConfiguredError('USB service is not available');
  }
  const ports = await usb.list();
  return ports.map((port) => ({
    path: port.path,
    name: getDeviceName(port),
    pnpId: port.pnpId,
    adapter: findAdapter(port),
  }));
}

module.exports = {
  getUsbPorts,
};
