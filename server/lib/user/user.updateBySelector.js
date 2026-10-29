const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { USER_ROLE } = require('../../utils/constants');
const passwordUtils = require('../../utils/password');

/**
 * @description Update a user by his selector.
 * @param {string} selector - The user selector.
 * @param {object} newUser - The new user.
 * @param {string} [currentSessionId] - Session the update comes from, kept when the password changes.
 * @returns {Promise} Return the updated user.
 * @example
 * gladys.user.updateBySelector('tony', {
 *    picture: 'xxx'
 * });
 */
async function updateBySelector(selector, newUser, currentSessionId = null) {
  const user = await db.User.findOne({
    where: {
      selector,
    },
  });

  if (user === null) {
    throw new NotFoundError(`User not found`);
  }

  // The instance must always keep an administrator: without one, nobody can
  // reach the users settings anymore to give the role back.
  if (user.role === USER_ROLE.ADMIN && newUser.role !== undefined && newUser.role !== USER_ROLE.ADMIN) {
    const otherAdminsCount = await db.User.count({
      where: {
        role: USER_ROLE.ADMIN,
        id: {
          [Op.ne]: user.id,
        },
      },
    });
    if (otherAdminsCount === 0) {
      throw new BadParameters('The last administrator of the instance cannot lose the admin role');
    }
  }

  if (newUser.password && newUser.password.length < 8) {
    throw new BadParameters('Password is too short');
  }

  if (newUser.password) {
    newUser.password = await passwordUtils.hash(newUser.password);
  }

  await user.update(newUser);

  // a new password logs out every session of the user but the one it was changed from
  if (newUser.password) {
    await this.session.revokeLoginSessions(user.id, currentSessionId);
  }

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
