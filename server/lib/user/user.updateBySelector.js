const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const passwordUtils = require('../../utils/password');

/**
 * @description Update a user by his selector.
 * @param {string} selector - The user selector.
 * @param {object} newUser - The new user.
 * @returns {Promise} Return the updated user.
 * @example
 * gladys.user.updateBySelector('tony', {
 *    picture: 'xxx'
 * });
 */
async function updateBySelector(selector, newUser) {
  const user = await db.User.findOne({
    where: {
      selector,
    },
  });

  if (user === null) {
    throw new NotFoundError(`User not found`);
  }

  if (newUser.password && newUser.password.length < 8) {
    throw new BadParameters('Password is too short');
  }

  if (newUser.password) {
    newUser.password = await passwordUtils.hash(newUser.password);
  }

  await user.update(newUser);
  const userPlain = user.get({ plain: true });
  this.stateManager.setState('user', user.selector, userPlain);
  const userPlainCopied = { ...userPlain };
  delete userPlainCopied.password;
  delete userPlainCopied.telegram_user_id;
  return userPlainCopied;
}

module.exports = {
  updateBySelector,
};
