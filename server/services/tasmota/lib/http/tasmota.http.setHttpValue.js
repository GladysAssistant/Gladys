const { featureStatus } = require('../mqtt/featureStatus');
const { request, buildUrl } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {Object} device - Device.
 * @param {string} networkAddress - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * status('192.168.1.1', 11);
 */
function setHttpValue(device, networkAddress, command, value) {
  const fillDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.gladys.event, 'StatusSTS');
  };

  const errorCallback = () => {};

  request(
    buildUrl(`http://${networkAddress}/cm?cmnd=${command} ${value}`, device),
    fillDevice,
    errorCallback,
    errorCallback,
  );
}

module.exports = {
  setHttpValue,
};
