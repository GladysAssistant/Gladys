/**
 * @description Delete all devices (and variables) of withings integration.
 * @example
 * withings.deleteDevices();
 */
async function deleteDevices() {
  await this.gladys.device.destroyByServiceId(this.serviceId);
}

module.exports = {
  deleteDevices,
};
