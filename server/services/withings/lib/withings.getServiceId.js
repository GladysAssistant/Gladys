/**
 * @description Send the Withings service id.
 * @returns {Promise} Resolve with withings service id.
 * @example
 * withings.getServiceId();
 */
async function getServiceId() {
  return { success: true, serviceId: this.serviceId };
}

module.exports = {
  getServiceId,
};
