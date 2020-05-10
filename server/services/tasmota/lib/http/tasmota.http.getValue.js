const { featureStatus } = require('../utils/tasmota.featureStatus');
const { request, buildUrl } = require('./tasmota.http.request');

/**
 * @description Try to discover HTTP device.
 * @param {Object} device - Galdys device.
 * @example
 * getHttpValue({});
 */
function getValue(device) {
  const [, networkAddress] = device.externalId.split(':');

  const fillSTSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.tasmotaHandler.gladys.event);
  };
  const fillSNSDevice = (statusMsg) => {
    featureStatus(networkAddress, statusMsg, this.tasmotaHandler.gladys.event);
  };

  const errorCallback = () => {};

  request(buildUrl(`http://${networkAddress}/cm?cmnd=Status 11`, device), fillSTSDevice, errorCallback, errorCallback);
  request(buildUrl(`http://${networkAddress}/cm?cmnd=Status 8`, device), fillSNSDevice, errorCallback, errorCallback);
}

module.exports = {
  getValue,
};
