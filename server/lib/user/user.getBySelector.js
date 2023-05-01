const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a user by selector.
 * @param {string} selector - The selector of the user.
 * @returns {Promise} - Resolve with the user.
 * @example
 * gladys.user.getBySelector('my-user');
 */
async function getBySelector(selector) {
  const user = await db.User.findOne({
    where: {
      selector,
    },
  });

  if (user === null) {
    throw new NotFoundError('User not found');
  }

  const userPlain = user.get({ plain: true });
  delete userPlain.password;
  delete userPlain.telegram_user_id;
  return userPlain;
}

module.exports = {
  getBySelector,
};
