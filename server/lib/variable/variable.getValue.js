const db = require('../../models');

/**
 * @description Get the value of a variable
 * @param {string} key - The unique key of the variable.
 * @param {string} [serviceId] - The unique ID of a service, or null.
 * @param {string} [userId] - The unique ID of a user, or null.
 * @returns {Promise} - Resolve with the variable.
 * @example
 * variable.getValue('API_KEY', '5bbaaea4-2ad6-4f3e-9bbc-819b9d310309', 'd1d73559-a987-44eb-9453-3cbf5bcb5a2f');
 */
async function getValue(key, serviceId = null, userId = null) {
  const variable = await db.Variable.findOne({
    where: {
      name: key,
      service_id: serviceId,
      user_id: userId,
    },
  });

  // if variable was not found
  if (!variable) {
    return null;
  }

  // else, return the value
  return variable.value;
}

module.exports = {
  getValue,
};
