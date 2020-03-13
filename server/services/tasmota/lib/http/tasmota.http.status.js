const { addSelector } = require('../../../../utils/addSelector');
const { request } = require('./tasmota.http.request');
const { subStatus } = require('./tasmota.http.subStatus');
const logger = require('../../../../utils/logger');
const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

const createDevice = (networkAddress, serviceId) => {
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
        name: 'interface',
        value: 'http',
      },
    ],
  };

  addSelector(device);

  return device;
};

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {Object} manager - Tasmota manager.
 * @example
 * status('192.168.1.1');
 */
function status(networkAddress, manager) {
  delete manager.httpDevices[networkAddress];

  const storeDevice = (message) => {
    const statusMsg = JSON.parse(message);

    logger.debug(`Tasmota: HTTP receive ${statusMsg} message`);
    const device = createDevice(networkAddress, manager.serviceId);

    const { FriendlyName, Module } = statusMsg.Status;
    const [name] = FriendlyName;
    device.name = name;
    device.moduleId = Module;

    manager.httpDevices[networkAddress] = device;

    // Continue discovering
    subStatus(networkAddress, 11, manager);
  };

  const authErrorCallback = () => {
    const device = createDevice(networkAddress, manager.serviceId);

    device.name = networkAddress;
    device.needAuthentication = true;

    manager.httpDevices[networkAddress] = device;
  };

  const errorCallback = () => {
    delete manager.httpDevices[networkAddress];
  };

  request(`http://${networkAddress}/cm?cmnd=Status`, storeDevice, authErrorCallback, errorCallback);
}

module.exports = {
  status,
};
