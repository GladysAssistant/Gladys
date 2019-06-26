const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a service by name
 * @param {string} name - Name of the service.
 * @param {string} [pod_id] - Id of the pod.
 * @returns {Promise} - Resolve with the service of null.
 * @example
 * service.getByName('telegram', null);
 */
async function getByName(name, pod_id = null) {
  const service = await db.Service.findOne({
    where: {
      name,
      pod_id,
    },
  });
  if (service === null) {
    throw new NotFoundError('SERVICE_NOT_FOUND');
  }
  return service;
}

module.exports = {
  getByName,
};
