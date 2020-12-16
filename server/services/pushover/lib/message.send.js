const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { Error400 } = require('../../../utils/httpErrors');
const { default: axios } = require('axios');
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
function send(user, message, options) {
	if (!user) {
	  throw new ServiceNotConfiguredError('Pushover not configured');
	}
	
	const url = `https://api.pushover.net/1/messages.json?token=${this.token}&user=${this.user}&message=${message}&title=Gladys Assistant&device=${user}`;
	try {
	  const { data } = axios.post(url);
	} catch (e) {
	  logger.error(e);
	  throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
	}
}

module.exports = {
  send,
};
