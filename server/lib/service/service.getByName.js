const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a service by name.
 * @param {string} name - Name of the service.
 * @param {string} [podId] - Id of the pod.
 * @returns {Promise} - Resolve with the service of null.
 * @example
 * service.getByName('telegram', null);
 */
async function getByName(name, podId = null) {
  const service = await db.Service.findOne({
    where: {
      name,
      pod_id: podId,
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
