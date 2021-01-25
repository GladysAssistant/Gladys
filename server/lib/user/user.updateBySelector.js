const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a user by his selector.
 * @param {string} selector - The user selector.
 * @param {Object} newUser - The new user.
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
