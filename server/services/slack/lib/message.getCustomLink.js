const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { generateApiKey } = require('../../../utils/refreshToken');

const CACHE_KEY_BASE = 'slack:deeplinking:user';

/**
 * @description Get custom link
 * @param {string} userId - The user requesting the link.
 * @example
 * const link = await getCustomLink();
 */
async function getCustomLink(userId) {
  if (!this.bot) {
    throw new ServiceNotConfiguredError('Slack not configured');
  }
  const { apiKey } = await generateApiKey();
  this.gladys.cache.set(`${CACHE_KEY_BASE}:${apiKey}`, userId);
  return apiKey;
}

module.exports = {
  getCustomLink,
};
