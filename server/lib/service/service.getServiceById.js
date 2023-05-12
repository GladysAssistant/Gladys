/**
 * @public
 * @description Get service by its id.
 * @param {string} id - Id of the service to get.
 * @returns {object} Return the service or null if not present.
 * @example
 * service.getServiceById('99dc10bb-14ab-49dc-bd11-f724e98fc97c');
 */
function getServiceById(id) {
  return this.stateManager.get('serviceById', id);
}

module.exports = {
  getServiceById,
};
