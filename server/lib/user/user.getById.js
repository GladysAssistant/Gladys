const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function return a user by id.
 * @name gladys.user.getById
 * @param {string} id - The id of the user.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getById('6b9bc8b7-b98d-4dda-b0fd-88fc10bd0b00');
 */
async function getById(id) {
  const user = await db.User.findByPk(id, {
    attributes: [
      'id',
      'firstname',
      'lastname',
      'selector',
      'email',
      'language',
      'birthdate',
      'role',
      'temperature_unit_preference',
      'distance_unit_preference',
      'created_at',
      'updated_at',
    ],
  });
  if (user === null) {
    throw new NotFoundError(`User "${id}" not found`);
  }
  return user.get({ plain: true });
}

module.exports = {
  getById,
};
