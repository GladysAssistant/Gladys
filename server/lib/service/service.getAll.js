const db = require('../../models');

/**
 * @description Get all services.
 * @param {string} [pod_id] - Id of the pod.
 * @returns {Promise} - Resolve with services.
 * @example
 * service.getAll(null);
 */
async function getAll(pod_id = null) {
  return db.Service.findAll({
    where: {
      pod_id,
    },
  });
}

module.exports = {
  getAll,
};
