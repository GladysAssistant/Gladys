const db = require('../../models');

/**
 * @description Get all variables matching with key
 * @param {string} key - The unique key of the variable.
 * @param {string} [serviceId] - The unique ID of a service, or null.
 * @param {string} [userId] - The unique ID of a user, or null.
 * @example
 * gladys.user.getVariables();
 */
async function getVariables(key, serviceId = null, userId = null) {
  const where = {
    name: key,
    service_id: serviceId,
    ...(userId && { user_id: userId }),
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
