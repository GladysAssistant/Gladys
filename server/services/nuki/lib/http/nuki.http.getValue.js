const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { LOCK_STATES } = require('../utils/nuki.constants');

/**
 * @description Get device values through HTTP.
 * @param {object} device - Galdys device.
 * @example
 * nukiHttpHandler.getValue(device);
 */
async function getValue(device) {
  const { gladys } = this.nukiHandler;
  const smartlockId = device.external_id.split(':')[1];
  const values = await this.nukiApi.getSmartlock(smartlockId);

  

  // poll battery
  const batteryCharge = values.state.batteryCharge;
  logger.debug(`Lock ${device.external_id} has ${batteryCharge}% batteryCharge`);
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:battery`,
    state: Math.round(batteryCharge),
  });

  // poll state
  const state = values.state.state;
  logger.debug(`Lock ${device.external_id} is in ${state} state`);
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:state`,
    state,
  });

  // Update button state
  const binaryValue = LOCK_STATES[state] === 'locked' ? 0 : 1;
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:button`,
    state: binaryValue,
  });
}

module.exports = {
  getValue,
};
