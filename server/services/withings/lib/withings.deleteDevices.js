/**
 * @description Delete all devices (and variables) of withings integration.
 * @returns {Promise} Resolve with succes result.
 * @example
 * withings.deleteDevices();
 */
async function deleteDevices() {
  await this.gladys.device.destroyBySelectorPattern('withings');
  return { sucess: true };
}

module.exports = {
  deleteDevices,
};
