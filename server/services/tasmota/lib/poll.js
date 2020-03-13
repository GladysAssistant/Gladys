const { getHttpValue } = require('./http/tasmota.http.getHttpValue');
/**
 * @description Polling requested device.
 * @param {Object} device - Device to poll.
 * @example
 * tasmotaManager.poll({}),
 */
function poll(device) {
  const externalId = device.external_id;
  const [, networkAddress] = externalId.split(':');
  getHttpValue(networkAddress, this.gladys.event);
}

module.exports = {
  poll,
};
