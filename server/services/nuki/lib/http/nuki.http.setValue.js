const logger = require('../../../../utils/logger');

const LOCK_ACTION = 2;
const UNLOCK_ACTION = 1;

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
  value === 0 ? action = LOCK_ACTION : action = UNLOCK_ACTION;
  const smartlockId = device.external_id.split(':')[1];
  await this.nukiApi.setAction(smartlockId, action);
}

module.exports = {
  setValue,
};
