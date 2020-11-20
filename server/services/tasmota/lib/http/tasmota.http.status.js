const { addSelector } = require('../../../../utils/addSelector');
const { request, buildUrl } = require('./tasmota.http.request');
const logger = require('../../../../utils/logger');
const { DEVICE_POLL_FREQUENCIES, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../tasmota.constants');

const createDevice = (networkAddress, serviceId, username, password) => {
  const externalId = `tasmota:${networkAddress}`;
  const device = {
    name: networkAddress,
    external_id: externalId,
    selector: externalId,
    features: [],
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    params: [
      {
        name: DEVICE_PARAM_NAME.PROTOCOL,
        value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP,
      },
    ],
  };

  if (username) {
    device.params.push({
      name: DEVICE_PARAM_NAME.USERNAME,
      value: username,
    });
  }

  if (password) {
    device.params.push({
      name: DEVICE_PARAM_NAME.PASSWORD,
      value: password,
    });
  }

  addSelector(device);

  return device;
};

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {string} username - Device username.
 * @param {string} password - Device password.
 * @example
 * status('192.168.1.1');
 */
function status(networkAddress, username, password) {
  delete this.discoveredDevices[networkAddress];
  const device = createDevice(networkAddress, this.tasmotaHandler.serviceId, username, password);

  const storeDevice = (message) => {
    const statusMsg = JSON.parse(message);

    logger.debug(`Tasmota: HTTP receive message for ${networkAddress}: ${statusMsg}`);

    const { FriendlyName, Module } = statusMsg.Status;
    const [name] = FriendlyName;
    device.name = name;
    device.model = Module;

    this.discoveredDevices[networkAddress] = device;

    // Continue discovering
    this.subStatus(networkAddress, username, password, 11);
  };

  const authErrorCallback = () => {
    device.needAuthentication = true;

    this.discoveredDevices[networkAddress] = device;

    this.tasmotaHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
  };

  const errorCallback = () => {
    delete this.discoveredDevices[networkAddress];
  };

  request(buildUrl(device, 'Status'), storeDevice, authErrorCallback, errorCallback);
}

module.exports = {
  status,
};
