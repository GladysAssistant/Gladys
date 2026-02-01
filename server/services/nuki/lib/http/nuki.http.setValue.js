const { NUKI_LOCK_ACTIONS } = require('../utils/nuki.constants');
const { EVENTS, LOCK } = require('../../../../utils/constants');

/**
 * @description Set value value.
 * @param {object} device - Device.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * nukiHTTPHandler.setValue(device, 'lock', 0);
 */
function setValue(device, command, value) {
  const { gladys } = this.nukiHandler;
  const action = value === 1 ? NUKI_LOCK_ACTIONS.LOCK : NUKI_LOCK_ACTIONS.UNLOCK;
  const smartlockId = device.external_id.split(':')[1];
  this.nukiApi.setAction(smartlockId, action);

  // Set the state to activity while waiting for the real state
  gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `${device.external_id}:state`,
    state: LOCK.STATE.ACTIVITY,
  });

  // Wait 10 seconds before getting the new state
  setTimeout(() => {
    this.getValue(device);
  }, 10000);
}

module.exports = {
  setValue,
};
