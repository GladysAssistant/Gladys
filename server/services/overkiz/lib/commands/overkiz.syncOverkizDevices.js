const logger = require('../../../../utils/logger');

const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Update Gateway State.
 * @param {object} gateways - List of gateways.
 * @example
 * overkiz.updateGatewayState();
 */
function updateGatewayState(gateways) {
  logger.debug('UpdateGatwayState');

  this.gateways = gateways;
}

// eslint-disable-next-line jsdoc/require-returns
/**
 * @description Update Devices State.
 * @param {object} devices - List of devices.
 * @param {object} rootPlace - Root place.
 * @example
 * overkiz.updateDevicesState(devices, rootPlace);
 */
function updateDevicesState(devices, rootPlace) {
  logger.debug('UpdateDevicesState');

  devices.forEach((device) => {
    const placeObj = rootPlace.subPlaces.find((place) => place.oid === device.placeOID);
    if (placeObj) {
      device.place = placeObj.label;
    }
    this.devices[device.oid] = device;
    delete this.devices[device.oid].api;
  });
}

/**
 * @description Synchronize Overkiz devices.
 * @returns {Promise<object>} Overkiz devices.
 * @example
 * overkiz.syncOverkizDevices();
 */
async function syncOverkizDevices() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('OVERKIZ_NOT_CONNECTED');
  }
  logger.debug(`Overkiz : Starting discovery`);

  this.scanInProgress = true;

  const setup = await this.overkizServerAPI.getSetup();
  updateGatewayState.call(this, [ setup.gateways ]);
  updateDevicesState.call(this, setup.devices, setup.rootPlace);

  this.scanInProgress = false;
}

module.exports = {
  syncOverkizDevices,
  updateDevicesState,
};
