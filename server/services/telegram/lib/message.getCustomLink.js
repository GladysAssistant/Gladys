const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { generateApiKey } = require('../../../utils/refreshToken');

const CACHE_KEY_BASE = 'telegram:deeplinking:user';

/**
 * @description Get custom link.
 * @param {string} userId - The user requesting the link.
 * @returns {Promise<string>} Resolve with URL.
 * @example
 * const link = await getCustomLink();
 */
async function getCustomLink(userId) {
  if (!this.bot) {
    throw new ServiceNotConfiguredError('Telegram not configured');
  }
  const telegramBotInfos = await this.bot.getMe();
  const { apiKey } = await generateApiKey();
  this.gladys.cache.set(`${CACHE_KEY_BASE}:${apiKey}`, userId);
  const link = `https://telegram.me/${telegramBotInfos.username}?start=${apiKey}`;
  return link;
}

module.exports = {
  getCustomLink,
};
