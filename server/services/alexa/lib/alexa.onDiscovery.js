const uuid = require('uuid');
const { syncDeviceConverter } = require('./syncDeviceConverter');

/**
 * @public
 * @description Returns devices formatted the Amazon Alexa way.
 * @returns {object} Resolve discovery response.
 * @example
 * onDiscovery();
 */
function onDiscovery() {
  const gladysDevices = Object.values(this.gladys.stateManager.state.device).map((store) => store.get());
  // Convert it to Alexa devices
  const endpoints = gladysDevices.map((d) => syncDeviceConverter(d)).filter((d) => d !== null);

  const response = {
    event: {
      header: {
        namespace: 'Alexa.Discovery',
        name: 'Discover.Response',
        payloadVersion: '3',
        messageId: uuid.v4(),
      },
      payload: {
        endpoints,
      },
    },
  };

  return response;
}

module.exports = {
  onDiscovery,
};
