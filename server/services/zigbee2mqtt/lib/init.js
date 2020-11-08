const { DEFAULT } = require('./constants');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function init() {
  DEFAULT.TOPICS.forEach((topic) => {
    this.subscribe(topic, this.handleMqttMessage.bind(this));
  });

  const configuration = await this.getConfiguration();
  await this.connect(configuration);
}

module.exports = {
  init,
};
