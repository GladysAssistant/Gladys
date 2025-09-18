const { NUKI_LOCK_ACTIONS } = require('../utils/nuki.constants');

/**
 * @description Set value value.
 * @param {object} device - Device.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * nukiHTTPHandler.setValue(device, 'lock', 0);
 */
async function setValue(device, command, value) {
  let action;
  value === 0 ? (action = NUKI_LOCK_ACTIONS.LOCK) : (action = NUKI_LOCK_ACTIONS.UNLOCK);
  const smartlockId = device.external_id.split(':')[1];
  await this.nukiApi.setAction(smartlockId, action);
}

module.exports = {
  setValue,
};
