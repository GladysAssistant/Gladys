const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Register the Gladys Plus webhook URL on the Netatmo account.
 * Best-effort: a failure only disables the near real-time events, the polling stays the source of truth.
 * @returns {Promise<boolean>} True when the webhook is registered.
 * @example
 * await netatmo.registerWebhook();
 */
async function registerWebhook() {
  const webhookUrl = (this.configuration.webhookUrl || '').trim();
  if (webhookUrl === '' || !this.accessToken) {
    logger.debug('Netatmo: no webhook URL configured or no access token, skipping webhook registration');
    this.webhookRegistered = false;
    return false;
  }
  try {
    const response = await fetch(`${API.ADD_WEBHOOK}?${new URLSearchParams({ url: webhookUrl })}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.warn('Netatmo: unable to register webhook - Details: ', response.status, rawBody);
      this.webhookRegistered = false;
      return false;
    }
    logger.info('Netatmo: webhook registered');
    this.webhookRegistered = true;
    return true;
  } catch (e) {
    logger.warn('Netatmo: unable to register webhook - Details: ', e);
    this.webhookRegistered = false;
    return false;
  }
}

module.exports = {
  registerWebhook,
};
