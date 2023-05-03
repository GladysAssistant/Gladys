const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
/**
 * @description Refresh cache of gateway user keys.
 * @example
 * this.refreshUserKeys();
 */
async function refreshUserKeys() {
  // getting users keys
  this.usersKeys = JSON.parse(await this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_USERS_KEYS));
}

module.exports = { refreshUserKeys };
