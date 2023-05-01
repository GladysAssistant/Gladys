/**
 * @public
 * @description Return all services.
 * @returns {object} Return all services.
 * @example
 * service.getServices();
 */
function getServices() {
  return this.stateManager.state.service;
}

module.exports = {
  getServices,
};
