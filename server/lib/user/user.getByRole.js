const db = require('../../models');

/**
 * @private
 * @description Get list of users by role.
 * @name gladys.user.getByRole
 * @param {string} role - The role of the users.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getByRole('admin');
 */
async function getByRole(role) {
  const queryParams = {
    attributes: ['id', 'firstname', 'lastname', 'selector', 'email', 'language'],
    offset: 0,
    order: [['firstname', 'ASC']],
    where: {
      role,
    },
  };

  const users = await db.User.findAll(queryParams);

  const usersPlain = users.map((user) => {
    // we converted the user to plain object
    return user.get({ plain: true });
  });

  return usersPlain;
}

module.exports = {
  getByRole,
};
