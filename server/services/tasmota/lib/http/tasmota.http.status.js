const { addSelector } = require('../../../../utils/addSelector');
const { request } = require('./tasmota.http.request');
const { subStatus } = require('./tasmota.http.subStatus');
const logger = require('../../../../utils/logger');
const { DEVICE_POLL_FREQUENCIES, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../constants');

const createDevice = (networkAddress, serviceId, username, password) => {
  const externalId = `tasmota:${networkAddress}`;
  const device = {
    external_id: externalId,
    selector: externalId,
    features: [],
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    params: [
      {
        name: DEVICE_PARAM_NAME.INTERFACE,
        value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.INTERFACE].HTTP,
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
 * @param {Object} manager - Tasmota manager.
 * @example
 * status('192.168.1.1', tasmotaManager);
 */
function status(networkAddress, username, password, manager) {
  delete manager.httpDevices[networkAddress];

  const storeDevice = (message) => {
    const statusMsg = JSON.parse(message);

    logger.debug(`Tasmota: HTTP receive message for ${networkAddress}: ${statusMsg}`);
    const device = createDevice(networkAddress, manager.serviceId, username, password);

    const { FriendlyName, Module } = statusMsg.Status;
    const [name] = FriendlyName;
    device.name = name;
    device.moduleId = Module;

    manager.httpDevices[networkAddress] = device;

    // Continue discovering
    subStatus(networkAddress, username, password, 11, manager);
  };

  const authErrorCallback = () => {
    const device = createDevice(networkAddress, manager.serviceId);

    device.name = networkAddress;
    device.needAuthentication = true;

    manager.httpDevices[networkAddress] = device;

    manager.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_HTTP_DEVICE);
  };

  const errorCallback = () => {
    delete manager.httpDevices[networkAddress];
  };

  request(
    `http://${networkAddress}/cm?user=${username}&password=${password}&cmnd=Status`,
    storeDevice,
    authErrorCallback,
    errorCallback,
  );
}

module.exports = {
  status,
};
