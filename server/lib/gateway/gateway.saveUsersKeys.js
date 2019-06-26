/**
 * @description Save gateway user keys.
 * @param {Array} keys - Array of keys.
 * @example
 * saveUsersKeys([]);
 */
async function saveUsersKeys(keys) {
  await this.variable.setValue('GLADYS_GATEWAY_USERS_KEYS', JSON.stringify(keys));
}

module.exports = {
  saveUsersKeys,
};
