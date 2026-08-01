const logger = require('../../../utils/logger');

/**
 * @description Disable the Telegram integration: stop the bot, remove the API key
 * and unlink all users from their Telegram account.
 * @returns {Promise} Resolve when the integration is disabled.
 * @example
 * disable();
 */
async function disable() {
  logger.info('Disabling Telegram integration');
  // First, we stop the bot so it stops receiving/sending messages
  await this.disconnect();
  // Then, we delete the API key of the bot
  await this.gladys.variable.destroy('TELEGRAM_API_KEY', this.serviceId);
  // Finally, we unlink all users from their Telegram account
  const users = await this.gladys.user.get({ fields: ['id'] });
  await Promise.all(users.map((user) => this.gladys.user.update(user.id, { telegram_user_id: null })));
  logger.info('Telegram integration disabled');
}

module.exports = {
  disable,
};
