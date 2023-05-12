const { featureStatus } = require('../utils/tasmota.featureStatus');
const { request, buildUrl } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {object} device - Galdys device.
 * @example
 * getHttpValue({});
 */
function getValue(device) {
  const [, networkAddress] = device.external_id.split(':');

  const fillSTSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.tasmotaHandler.gladys.event);
  };
  const fillSNSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.tasmotaHandler.gladys.event);
  };

  const errorCallback = () => {};

  request(buildUrl(device, 'Status 11'), fillSTSDevice, errorCallback, errorCallback);
  request(buildUrl(device, 'Status 8'), fillSNSDevice, errorCallback, errorCallback);
}

module.exports = {
  getValue,
};
