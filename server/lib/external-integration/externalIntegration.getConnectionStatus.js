/**
 * @description Get the in-memory application-level connection status of an
 * integration (see setConnectionStatus). Null when the integration never
 * published one since the last Gladys restart.
 * @param {string} serviceId - The id of the external integration service.
 * @returns {object} { connected, message } or null.
 * @example
 * const status = gladys.externalIntegration.getConnectionStatus(service.id);
 */
function getConnectionStatus(serviceId) {
  return this.connectionStatuses.get(serviceId) || null;
}

module.exports = {
  getConnectionStatus,
};
