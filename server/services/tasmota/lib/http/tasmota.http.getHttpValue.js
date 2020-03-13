const { featureStatus } = require('../mqtt/featureStatus');
const { request } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {string} networkAddress - Device network address.
 * @param {Object} gladysEvent - Gladys event manager.
 * @example
 * getHttpValue('192.168.1.1', {});
 */
function getHttpValue(networkAddress, gladysEvent) {
  const fillSTSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, gladysEvent);
  };
  const fillSNSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, gladysEvent);
  };

  const errorCallback = () => {};

  request(`http://${networkAddress}/cm?cmnd=Status 11`, fillSTSDevice, errorCallback, errorCallback);
  request(`http://${networkAddress}/cm?cmnd=Status 8`, fillSNSDevice, errorCallback, errorCallback);
}

module.exports = {
  getHttpValue,
};
