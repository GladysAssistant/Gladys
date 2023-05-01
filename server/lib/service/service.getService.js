/**
 * @public
 * @description Load all services.
 * @param {string} name - Name of the service to get.
 * @returns {object} Return the service or null if not present.
 * @example
 * service.getService('telegram');
 */
function getService(name) {
  return this.stateManager.get('service', name);
}

module.exports = {
  getService,
};
