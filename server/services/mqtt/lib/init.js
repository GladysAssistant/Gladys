const { DEFAULT } = require('./constants');
const { HOME_ASSISTANT } = require('./homeAssistant/constants');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function init() {
  DEFAULT.TOPICS.forEach((topic) => {
    this.subscribe(topic, this.handleGladysMessage.bind(this));
  });

  // Listen to the Home Assistant discovery topic
  this.subscribe(HOME_ASSISTANT.DISCOVERY_TOPIC, this.handleHomeAssistantDiscoveryMessage.bind(this));

  // Listen to state topics of existing devices created
  // through the Home Assistant discovery protocol
  const devices = await this.gladys.device.get({ service: 'mqtt' });
  devices.forEach((device) => {
    this.listenToHomeAssistantDeviceStateIfNeeded(device);
  });

  const configuration = await this.getConfiguration();

  // Check for container configuration
  await this.updateContainer(configuration);

  await this.connect(configuration);
}

module.exports = {
  init,
};
