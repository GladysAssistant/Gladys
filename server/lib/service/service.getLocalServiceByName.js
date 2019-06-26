const db = require('../../models');

/**
 * @description Get a local service ny name.
 * @param {string} name - Name of the service.
 * @returns {Promise} - Resolve with the service of null.
 * @example
 * service.getLocalServiceByName('telegram');
 */
async function getLocalServiceByName(name) {
  return db.Service.findOne({
    where: {
      name,
      pod_id: null,
    },
  });
}

module.exports = {
  getLocalServiceByName,
};
