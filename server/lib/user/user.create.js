const uuid = require('uuid');
const db = require('../../models');

/**
 * @public
 * @description This function create a user.
 * @name gladys.user.create
 * @param {Object} user - A new user.
 * @param {string} user.firstname - The firstname of the user.
 * @param {string} user.lastname - The lastname of the user.
 * @param {string} user.email - The email of the user.
 * @param {string} user.password - The password for his account (min 8 characters).
 * @param {string} user.birthdate - The birthdate of the user.
 * @param {string} user.language - The language of the user.
 * @param {string} user.role - The role of the user (admin, habitant, guest).
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.create({
 *  firstname: 'Tony'
 * });
 *
 */
async function create(user) {
  const createdUser = await db.User.create(user);
  const plainUser = createdUser.get({ plain: true });
  delete plainUser.password;
  delete plainUser.picture;
  this.stateManager.setState('user', plainUser.selector, plainUser);
  // if the instance doesn't have a clientId yet, we create it.
  const clientId = await this.variable.getValue('GLADYS_INSTANCE_CLIENT_ID');
  if (clientId === null) {
    await this.variable.setValue('GLADYS_INSTANCE_CLIENT_ID', uuid.v4());
  }
  return plainUser;
}

module.exports = {
  create,
};
