const { WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { recursiveSearch, addFeature } = require('../features');
const { request } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {string} username - Device username.
 * @param {string} password - Device password.
 * @param {number} statusId - Status ID to call.
 * @param {Object} manager - Tasmota manager.
 * @example
 * status('192.168.1.1', 11, {});
 */
function subStatus(networkAddress, username, password, statusId, manager) {
  const device = manager.httpDevices[networkAddress];

  const fillDevice = (message) => {
    const statusMsg = JSON.parse(message);

    recursiveSearch(statusMsg, (featureTemplate, fullKey, command, value) => {
      addFeature(device, featureTemplate, fullKey, command, value);
    });

    // Continue call
    if (statusId === 11) {
      subStatus(networkAddress, username, password, 8, manager);
    } else {
      manager.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
    }
  };

  const authErrorCallback = () => {
    device.needAuthentication = true;
    manager.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
  };

  const errorCallback = () => {
    delete manager.httpDevices[networkAddress];
  };

  request(
    `http://${networkAddress}/cm?user=${username}&password=${password}&cmnd=Status ${statusId}`,
    fillDevice,
    authErrorCallback,
    errorCallback,
  );
}

module.exports = {
  subStatus,
};
