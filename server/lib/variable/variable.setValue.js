const db = require('../../models');

/**
 * @description Set the value of a variable
 * @param {string} key - The unique key of the variable.
 * @param {string} value - The value of the variable.
 * @param {string} [serviceId] - The unique ID of a service, or null.
 * @param {string} [userId] - The unique ID of a user, or null.
 * @returns {Promise} - Resolve with the variable.
 * @example
 * variable.setValue('API_KEY', 'XXXX', '5bbaaea4-2ad6-4f3e-9bbc-819b9d310309', 'd1d73559-a987-44eb-9453-3cbf5bcb5a2f');
 */
async function setValue(key, value, serviceId = null, userId = null) {
  const variable = await db.Variable.findOne({
    where: {
      name: key,
      service_id: serviceId,
      user_id: userId,
    },
  });

  // if variable doesn't exist, we create it
  if (variable === null) {
    return db.Variable.create({
      value,
      name: key,
      service_id: serviceId,
      user_id: userId,
    });
  }

  // if it exists, we update it
  return variable.update({ value });
}

module.exports = {
  setValue,
};
