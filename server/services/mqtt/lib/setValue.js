/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The device feature to control.
 * @param {number} value - The value to set.
 * @example
 * mqtt.setValue();
 */
function setValue(device, deviceFeature, value) {
  const originalExternalId = deviceFeature.external_id;
  // Removes 'mqtt:'
  const externalId = originalExternalId.substring(5, originalExternalId.length);
  this.publish(`gladys/${externalId}/update`, value);
}

module.exports = {
  setValue,
};
