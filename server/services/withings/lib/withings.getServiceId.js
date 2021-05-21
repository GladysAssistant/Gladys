/**
 * @description Send the Withings service id.
 * @returns {Object} Resolve with withings service id.
 * @example
 * withings.getServiceId();
 */
function getServiceId() {
  return { success: true, serviceId: this.serviceId };
}

module.exports = {
  getServiceId,
};
