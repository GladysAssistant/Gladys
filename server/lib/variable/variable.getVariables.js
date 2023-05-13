const db = require('../../models');

/**
 * @description Get all variables matching with key.
 * @param {string} key - The unique key of the variable.
 * @param {string} [serviceId] - The unique ID of a service, or null.
 * @returns {Promise<Array>} Resolves with list of variables.
 * @example
 * gladys.user.getVariables();
 */
async function getVariables(key, serviceId = null) {
  const where = {
    name: key,
    service_id: serviceId,
  };

  const variables = await db.Variable.findAll({
    attributes: ['value', 'user_id'],
    where,
  });

  return variables.map((variable) => variable.get({ plain: true }));
}

module.exports = {
  getVariables,
};
