const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Store user tokens into database.
 * @param {object} params - Raw eWeLink user tokens.
 * @example
 * await this.saveTokens({ accessToken, refreshToken });
 */
async function saveTokens(params) {
  // Store tokens into databate
  await this.gladys.variable.setValue(CONFIGURATION_KEYS.USER_TOKENS, JSON.stringify(params), this.serviceId);
}

module.exports = {
  saveTokens,
};
