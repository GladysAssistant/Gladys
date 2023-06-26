const db = require('../../models');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Set the value of a variable.
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

  let createdOrUpdatedVariable;

  // if variable doesn't exist, we create it
  if (variable === null) {
    createdOrUpdatedVariable = await db.Variable.create({
      value,
      name: key,
      service_id: serviceId,
      user_id: userId,
    });
  } else {
    // if it exists, we update it
    createdOrUpdatedVariable = await variable.update({ value });
  }

  // if the variable updated is the timezone settings, we send an event for the system
  // to reload all timezone related code
  if (key === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
    this.event.emit(EVENTS.SYSTEM.TIMEZONE_CHANGED);
  }

  // if the variable updated is the gateway user keys, send event
  if (key === SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_USERS_KEYS) {
    this.event.emit(EVENTS.GATEWAY.USER_KEYS_CHANGED);
  }

  return createdOrUpdatedVariable;
}

module.exports = {
  setValue,
};
