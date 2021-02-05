const db = require('../../models');
const passwordUtils = require('../../utils/password');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

/**
 * @description Update a user password.
 * @param {string} userId - The user id to update his password.
 * @param {string} newPassword - The new password.
 * @returns {Promise} Return the updated user.
 * @example
 * gladys.user.updatePassword('184515e8-27c0-45c3-97f5-f5e7d14aecce', 'new-password');
 */
async function updatePassword(userId, newPassword) {
  const user = await db.User.findByPk(userId, {
    attributes: ['id'],
  });

  if (user === null) {
    throw new NotFoundError(`User not found`);
  }

  if (newPassword.length < 8) {
    throw new BadParameters('Password is too short');
  }

  const hashedPassword = await passwordUtils.hash(newPassword);

  await user.update({ password: hashedPassword });

  const plainUser = user.get({ plain: true });

  this.stateManager.setState('user', plainUser.selector, plainUser);
  this.stateManager.setState('userById', plainUser.id, plainUser);

  return {
    id: userId,
  };
}

module.exports = {
  updatePassword,
};
