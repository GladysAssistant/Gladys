const logger = require('../../utils/logger');
// const { NotFoundError } = require('../../utils/coreErrors');
/**
 * @description Command a scene.
 * @param {string} topic - MQTT topic.
 * @param {object} message - Handle a new message receive in MQTT.
 * @example
 * handleMessage('gladys/scene/selector', 'ON');
 */
async function handleMessage(topic, message) {
  const [, , selector] = topic.split('/');

  try {
    if (message === 'START') {
      await this.execute(selector);
    }
  } catch (e) {
    logger.debug(e);
  }
}

module.exports = {
  handleMessage,
};
