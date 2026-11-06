/**
 * @description Save gateway user keys.
 * @param {Array} keys - Array of keys.
 * @example
 * saveUsersKeys([]);
 */
async function saveUsersKeys(keys) {
  // "keys_changed" explains why a user was revoked: once accepted again, it no longer applies
  // (undefined properties are dropped by JSON.stringify)
  const keysToSave = keys.map((key) => (key.accepted === true ? { ...key, keys_changed: undefined } : key));
  await this.variable.setValue('GLADYS_GATEWAY_USERS_KEYS', JSON.stringify(keysToSave));
}

module.exports = {
  saveUsersKeys,
};
