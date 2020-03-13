const { featureStatus } = require('../mqtt/featureStatus');
const { request } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @param {Object} manager - Tasmota manager.
 * @example
 * status('192.168.1.1', 11);
 */
function setHttpValue(networkAddress, command, value, manager) {
  const fillDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, manager.gladys.event, 'StatusSTS');
  };

  const errorCallback = () => {};

  request(`http://${networkAddress}/cm?cmnd=${command} ${value}`, fillDevice, errorCallback, errorCallback);
}

module.exports = {
  setHttpValue,
};
