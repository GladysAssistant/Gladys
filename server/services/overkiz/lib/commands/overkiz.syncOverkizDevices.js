const logger = require('../../../../utils/logger');

const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Update Gateway State.
 * @param {Object} gateways - List of gateways.
 * @example
 * overkiz.updateGatewayState();
 */
function updateGatewayState(gateways) {
  logger.debug('UpdateGatwayState');

  this.gateways = gateways;

  // TODO send event
}

/**
 * @description Update Devices State.
 * @param {Object} devices - Devices.
 * @param {Object} rootPlace - RootPlace.
 * @return {Object}
 * @example
 * overkiz.updateDevicesState(devices, rootPlace);
 */
function updateDevicesState(devices, rootPlace) {
  logger.debug('UpdateDevicesState');

  devices.forEach((device) => {
    const placeObj = rootPlace.subPlaces.find((place) => place.oid === device.placeOID);
    if (placeObj) {
      device.place = placeObj.name;
    }
    this.devices[device.oid] = device;
    delete this.devices[device.oid].api;
  });
}

/**
 * @description Synchronize Overkiz devices.
 * @returns {Promise<Object>} Overkiz devices.
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
  updateGatewayState.call(this, setup.gateways[0]);

  const devices = await this.overkizServerAPI.getObjects();
  updateDevicesState.call(this, devices, setup.rootPlace);

  this.scanInProgress = false;
}

module.exports = {
  syncOverkizDevices,
};
