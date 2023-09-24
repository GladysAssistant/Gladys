const { featureStatus } = require('../utils/tasmota.featureStatus');
const { request, buildUrl } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {object} device - Device.
 * @param {string} networkAddress - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * status('192.168.1.1', 11);
 */
function setValue(device, networkAddress, command, value) {
  const fillDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.tasmotaHandler.gladys.event, 'StatusSTS');
  };

  const errorCallback = () => {};

  request(buildUrl(device, `${command} ${value}`), fillDevice, errorCallback, errorCallback);
}

module.exports = {
  setValue,
};
