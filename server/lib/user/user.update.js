const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a user.
 * @param {string} userId - The user id to update.
 * @param {Object} newUser - The new user.
 * @returns {Promise} Return the updated user.
 * @example
 * gladys.user.update('184515e8-27c0-45c3-97f5-f5e7d14aecce', {
 *    picture: 'xxx'
 * });
 */
async function update(userId, newUser) {
  const user = await db.User.findByPk(userId);

  if (user === null) {
    throw new NotFoundError(`User not found`);
  }

  await user.update(newUser);

  const plainUser = user.get({ plain: true });

  this.stateManager.setState('user', plainUser.selector, plainUser);
  this.stateManager.setState('userById', plainUser.id, plainUser);

  return {
    id: userId,
  };
}

module.exports = {
  update,
};
