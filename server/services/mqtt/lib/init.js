const { DEFAULT } = require('./constants');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function init() {
  DEFAULT.TOPICS.forEach((topic) => {
    this.subscribe(topic, this.handleGladysMessage.bind(this));
  });

  const configuration = await this.getConfiguration();

  // Check for container configuration
  await this.updateContainer(configuration);

  await this.connect(configuration);
}

module.exports = {
  init,
};
