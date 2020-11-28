const uuid = require('uuid');
const logger = require('../../../../utils/logger');
const { queryDeviceConverter } = require('../utils/googleActions.queryDeviceConverter');

/**
 * @description The function that will report a new device state.
 * This should be called when a device is added or removed for a given user id.
 * @param {Object} event - New state event.
 * @returns {Promise} A valid response.
 * @example
 * googleActions.reportState(event);
 *
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#reportstate
 */
async function reportState(event) {
  const gladysFeature = this.gladys.stateManager.get('deviceFeature', event.device_feature);
  const gladysDevice = this.gladys.stateManager.get('deviceById', gladysFeature.device_id);

  // Convert it to managed Google devices
  const device = queryDeviceConverter(gladysDevice);
  if (device) {
    const devices = { [gladysDevice.selector]: device };

    Object.keys(this.userSmarthome).forEach((userSelector) => {
      const request = {
        requestId: uuid.v4(),
        agentUserId: userSelector,
        payload: {
          devices,
        },
      };

      this.userSmarthome[userSelector]
        .reportState(request)
        .then((res) => {
          logger.debug(`GoogleActions request SYNC is successful: ${res}`);
        })
        .catch((res) => {
          logger.error(`GoogleActions request SYNC is failure: ${res}`);
        });
    });
  }
}

module.exports = {
  reportState,
};
