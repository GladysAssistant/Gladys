const { DEVICE_PARAMS } = require('../utils/awox.constants');

/**
 * @description Control an AwoX device
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} Resolve when the message is send to device.
 * @example
 * await awoxLegacy.setValue({ external_id: 'd03975bc5a71' }, { type: 'binary' }, 1);
 */
async function setValue(device, deviceFeature, value) {
  const { params = [], name } = device;
  const typeParam = params.find((p) => p.name === DEVICE_PARAMS.DEVICE_TYPE);

  if (!typeParam) {
    throw new Error(`AwoX: No handler matching device ${name}`);
  }

  return this.handlers[typeParam.value].setValue(device, deviceFeature, value);
}

module.exports = {
  setValue,
};
