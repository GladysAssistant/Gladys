const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function FreeMobileService(gladys, serviceId) {
  const axios = require('axios');
  let username;
  let accessToken;

  /**
   * @public
   * @description This function starts the FreeMobile service.
   * @example
   * gladys.services.free-mobile.start();
   */
  async function start() {
    logger.info('Starting Free Mobile service');
    username = await gladys.variable.getValue('FREE_MOBILE_USERNAME', serviceId);
    accessToken = await gladys.variable.getValue('FREE_MOBILE_ACCESS_TOKEN', serviceId);

    if (!username || username.length === 0) {
      throw new ServiceNotConfiguredError('No FreeMobile username found. Not starting Free Mobile service');
    }

    if (!accessToken || accessToken.length === 0) {
      throw new ServiceNotConfiguredError('No FreeMobile access_token found. Not starting Free Mobile service');
    }
  }

  /**
   * @description Send a sms.
   * @param {string} message - The message to send.
   * @example
   * gladys.services.free-mobile.sms.send('hello')
   */
  async function send(message) {
    const url = 'https://smsapi.free-mobile.fr/sendmsg';

    const params = {
      user: username,
      pass: accessToken,
      msg: message,
    };

    try {
      const response = await axios.get(url, { params });
      logger.debug('SMS successfully sent:', response.data);
    } catch (e) {
      logger.error('Error sending SMS:', e);
    }
  }

  /**
   * @public
   * @description This function stops the FreeMobile service.
   * @example
   *  gladys.services.free-mobile.stop();
   */
  async function stop() {
    logger.info('Stopping Free Mobile service');
  }

  return Object.freeze({
    start,
    stop,
    sms: {
      send,
    },
  });
};
