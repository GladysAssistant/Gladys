const { getDeviceState } = require('../connector/getDeviceState');
const logger = require('../../../../utils/logger');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Handle new device state and send it to SmartThings.
 * @param {Object} event - The event object.
 * @param {Object} event.device_feature_selector - The deviceFeature concerned.
 * @example
 * handleDeviceState({ device_feature_external_id: 'xx', state: 12 });
 */
async function handleDeviceState(event) {
  // Get device
  const deviceFeature = this.gladys.stateManager.get('deviceFeature', event.device_feature_selector);
  const device = this.gladys.stateManager.get('deviceById', deviceFeature.device_id);
  const deviceState = {
    externalDeviceId: device.external_id,
    states: getDeviceState([deviceFeature]),
  };

  if (deviceState.states.length > 0) {
    Object.keys(this.callbackUsers).forEach(async (userId) => {
      const { callbackAuthentication, callbackUrls } = this.callbackUsers[userId];
      try {
        await this.callbackState.updateState(callbackUrls, callbackAuthentication, [deviceState], (item) => {
          const callBackInfo = {
            callbackUrls,
            callbackAuthentication: item,
          };
          this.gladys.variable.setValue(
            VARIABLES.SMT_CALLBACK_OAUTH,
            JSON.stringify(callBackInfo),
            this.serviceId,
            userId,
          );
          this.callbackUsers[userId] = callBackInfo;
        });
      } catch (e) {
        logger.warn(`SmartThings failed to send callback device ${device.external_id} for user ${userId} : ${e}`);
      }
    });
  }
}

module.exports = { handleDeviceState };
