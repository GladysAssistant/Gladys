const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400 } = require('../../../utils/httpErrors');

/**
 * @description Send pushover message.
 * @param {string} device - Pushover Device ID.
 * @param {Object} message - Message object to send.
 * @param {Object} [options] - Options.
 * @example
 * send('iphone', {
 *   text: 'Hey'
 * });
 */
function send(device, message, options) {
  if (!device) {
    throw new ServiceNotConfiguredError('Pushover not configured');
  }

  const url = `https://api.pushover.net/1/messages.json?token=${this.token}&user=${this.user}&message=${message}&title=Gladys Assistant&device=${device}`;
  try {
    /* Need to add error handling */
    axios.post(url);
  } catch (e) {
    logger.error(e);
    throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
  }
}

module.exports = {
  send,
};
