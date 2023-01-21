const logger = require('../../utils/logger');

module.exports = function NtfyService(gladys, serviceId) {
  const { default: axios } = require('axios');
  /**
   * @public
   * @description This function starts the NtfyService
   * @example
   * gladys.services.ntfy.start();
   */
  async function start() {
    logger.info('Starting Ntfy service');
  }

  /**
   * @public
   * @description This function stops the NtfyService
   * @example
   * gladys.services.ntfy.stop();
   */
  async function stop() {
    logger.info('stopping Ntfy service');
  }

  /**
   * @description Send Ntfy notification.
   * @param {string} topic - Ntfy topic.
   * @param {Object} message - Message object to send.
   * @example
   * send('11212', {
   *   text: 'Hey'
   *   title: 'Coucou'
   * });
   */
  async function send(topic, message) {
    logger.debug(`Sending Ntfy notification in topic = ${topic} ${JSON.stringify(message)}.`);

    await axios.post('https://ntfy.sh/', {
      topic,
      title: message.title,
      message: message.text,
    });
  }

  return Object.freeze({
    start,
    stop,
    notification: {
      send,
    },
  });
};
