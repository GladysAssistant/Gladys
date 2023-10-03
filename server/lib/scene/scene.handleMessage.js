const logger = require('../../utils/logger');
// const { NotFoundError } = require('../../utils/coreErrors');
/**
 * @description Command a scene.
 * @param {object} message - Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
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
