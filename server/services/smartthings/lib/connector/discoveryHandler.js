const { getDeviceHandlerType } = require('./getDeviceHandlerType');
const logger = require('../../../../utils/logger');

/**
 * @description Discovery request. Respond with a list of devices. Called after installation of the
 * connector and every six hours after that.
 * @param {Object} response - Discovery response object.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/smartthings-schema-reference.html#Discovery
 * @see https://github.com/SmartThingsCommunity/st-schema-nodejs
 *
 * @example
 * await smartthingsHandler.discoveryHandler(response);
 */
function discoveryHandler(response) {
  const gladysDevices = this.getDevices();

  Object.values(gladysDevices).forEach((device) => {
    try {
      const deviceHandlerType = getDeviceHandlerType(device.features);
      response.addDevice(device.external_id, device.name, deviceHandlerType);
    } catch (e) {
      logger.warn(`SmartThings device handler type not detected for ${device.external_id} : ${e}`);
    }
  });
}

module.exports = {
  discoveryHandler,
};
