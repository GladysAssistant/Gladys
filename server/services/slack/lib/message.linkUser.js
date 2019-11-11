const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

const CACHE_KEY_BASE = 'slack:deeplinking:user';

/**
 * @description Link a user to a Slack chat.
 * @param {string} apiKey - Gladys per user deep linking key.
 * @param {string} chatId - Slack chatId.
 * @example
 * linkUser('7c2ba9f04ac4c07e3eb0517126c34373', '7984738473');
 */
async function linkUser(apiKey, chatId) {
  logger.debug(`Linking user = ${apiKey} to chatId = ${chatId}`);
  const userId = this.gladys.cache.get(`${CACHE_KEY_BASE}:${apiKey}`);
  if (!userId) {
    throw new NotFoundError('Api key not found');
  }
  logger.debug(`User id ${userId}`);
  await this.gladys.user.update(userId, {
    slack_user_id: chatId,
  });
  logger.debug(`Slack user linked with success.`);
}

module.exports = {
  linkUser,
};
