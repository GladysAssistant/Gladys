const { WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { recursiveSearch, addFeature } = require('../features');
const { request, buildUrl } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {string} username - Device username.
 * @param {string} password - Device password.
 * @param {number} statusId - Status ID to call.
 * @example
 * status('192.168.1.1', 11);
 */
function subStatus(networkAddress, username, password, statusId) {
  const device = this.discoveredDevices[networkAddress];

  const fillDevice = (message) => {
    const statusMsg = JSON.parse(message);

    recursiveSearch(statusMsg, (featureTemplate, fullKey, command, value) => {
      addFeature(device, featureTemplate, fullKey, command, value);
    });

    // Continue call
    if (statusId === 11) {
      this.subStatus(networkAddress, username, password, 8);
    } else {
      this.tasmotaHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
    }
  };

  const authErrorCallback = () => {
    device.needAuthentication = true;
    this.tasmotaHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
  };

  const errorCallback = () => {
    delete this.discoveredDevices[networkAddress];
  };

  request(buildUrl(device, `Status ${statusId}`), fillDevice, authErrorCallback, errorCallback);
}

module.exports = {
  subStatus,
};
