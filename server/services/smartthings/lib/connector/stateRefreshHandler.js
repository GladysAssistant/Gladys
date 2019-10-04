const { getDeviceState } = require('./getDeviceState');
const logger = require('../../../../utils/logger');

/**
 * @description State refresh request. Respond with the current states of all devices. Called after
 * device discovery runs.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/smartthings-schema-reference.html#State-Refresh
 * @see https://github.com/SmartThingsCommunity/st-schema-nodejs
 *
 * @param {Object} response - StateRefresh response object to fill.
 * @param {Array} requestedDevices - List of requested devices.
 *
 * @example
 * await smartthingsHandler.stateRefreshHandler(
 *  response,
 *  [
 *    {
 *      externalDeviceId: "partner-device-id-1",
 *    },
 *    {
 *      externalDeviceId: "partner-device-id-2",
 *    },
 *  ]
 * );
 */
function stateRefreshHandler(response, requestedDevices = undefined) {
  const gladysDevices = this.getDevices(requestedDevices);

  gladysDevices.forEach((device) => {
    try {
      const states = getDeviceState(device.features);
      response.addDevice(device.external_id, states);
    } catch (e) {
      logger.warn(`SmartThings device state not detected for ${device.external_id} : ${e}`);
    }
  });
}

module.exports = {
  stateRefreshHandler,
};
