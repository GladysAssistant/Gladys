const logger = require('../../../../utils/logger');
const { command } = require('./domoticz.command');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { parseDevices } = require('../../utils/domoticz.devices');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Function to sort devices by name.
 * @param {any} a - First device.
 * @param {any} b - Second device.
 * @returns {number} Sorted value (-1, 0 or 1) for a <=> b comparison.
 * @example deviceSort({name: "a"}, {name: "b"})
 */
function deviceSort(a, b) {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return 0;
}

/**
 * @description Return list of devices from Domoticz.
 * @param {string} order - Order to use, either 'asc' or 'des'.
 * @param {string} search - Optional filter by name, default ''.
 * @returns {Promise} List of found devices.
 * @example
 * domoticz.getDevices('asc', '');
 */
async function getDevices(order, search) {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('DOMOTICZ_NOT_CONNECTED');
  }
  logger.debug(`Domoticz: getDevices (order ${order}, search ${search})`);

  try {
    const data = await command(this.client, {
      type: 'devices',
      used: 'true',
      order: 'Name',
    });
    let devices = parseDevices(this.serviceId, data.result).sort(deviceSort);
    if (search) {
      const searchStr = search.toLowerCase();
      devices = devices.filter((dev) => dev.name.toLowerCase().includes(searchStr));
    }
    if ((order || 'asc') !== 'asc') {
      devices = devices.reverse();
    }
    return devices.map((dev) => this.completeDevice(dev));
  } catch (err) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED,
      payload: { err },
    });
    throw err;
  }
}

module.exports = {
  getDevices,
};
