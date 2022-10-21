const logger = require('../../../utils/logger');

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
  });
}

module.exports = {
  updateGatewayState,
  updateDevicesState,
};
