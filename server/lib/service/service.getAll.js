const db = require('../../models');

/**
 * @description Get all services.
 * @param {string} [podId] - Id of the pod.
 * @returns {Promise} - Resolve with services.
 * @example
 * service.getAll(null);
 */
async function getAll(podId = null) {
  return db.Service.findAll({
    where: {
      pod_id: podId,
    },
  });
}

module.exports = {
  getAll,
};
