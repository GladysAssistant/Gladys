const { MQTT_MODE } = require('../lib/constants');

/**
 * @description Whether Zigbee2mqtt is set up on this Gladys: a USB dongle or a network coordinator is saved, or the
 * broker of a Zigbee2mqtt that runs elsewhere. The setup page shows the wizard otherwise, and the other pages tell that
 * Zigbee2mqtt is not installed.
 * @param {object} configuration - The saved configuration (see getConfiguration).
 * @param {string} [configuration.z2mDriverPath] - Path of the USB dongle.
 * @param {string} [configuration.z2mNetworkAdapterUrl] - URL of the network coordinator.
 * @param {string} [configuration.mqttMode] - Local or external broker.
 * @returns {boolean} True when something is configured.
 * @example
 * isConfigured({ z2mDriverPath: '/dev/serial/by-id/usb-dongle' }); // true
 */
function isConfigured({ z2mDriverPath, z2mNetworkAdapterUrl, mqttMode }) {
  return Boolean(z2mDriverPath || z2mNetworkAdapterUrl || mqttMode === MQTT_MODE.EXTERNAL);
}

module.exports = {
  isConfigured,
};
