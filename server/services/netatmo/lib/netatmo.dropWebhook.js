const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Unregister the webhook from the Netatmo account. Best-effort.
 * @returns {Promise<boolean>} True when the webhook is dropped.
 * @example
 * await netatmo.dropWebhook();
 */
async function dropWebhook() {
  this.webhookRegistered = false;
  if (!this.accessToken) {
    logger.debug('Netatmo: no access token, skipping webhook unregistration');
    return false;
  }
  try {
    const response = await fetch(API.DROP_WEBHOOK, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.warn('Netatmo: unable to drop webhook - Details: ', response.status, rawBody);
      return false;
    }
    logger.info('Netatmo: webhook dropped');
    return true;
  } catch (e) {
    logger.warn('Netatmo: unable to drop webhook - Details: ', e);
    return false;
  }
}

module.exports = {
  dropWebhook,
};
