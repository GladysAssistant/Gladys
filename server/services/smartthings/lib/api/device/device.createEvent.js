const { call } = require('../call');
/**
 * @description Create new device event.
 * @param {Object} device - Device to create.
 * @param {Object} event - Event to send.
 * @param {string} token - OAuth bearer token.
 * @returns {Object} Created device event.
 * @see https://smartthings.developer.samsung.com/docs/api-ref/st-api.html#operation/createDeviceEvents
 * @example
 * createEvent(device, event, 'my-bearer-token')
 */
async function createEvent(device, event, token) {
  return call(`/devices/${device.deviceId}/events`, token, 'POST', event);
}

module.exports = {
  createEvent,
};
