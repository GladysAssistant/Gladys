const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a user by selector
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

  return user.get({ plain: true });
}

module.exports = {
  getBySelector,
};
