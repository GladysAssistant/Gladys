const db = require('../../models');

/**
 * @description Load all users from the database.
 * @returns {Promise} Resolve when success.
 * @example
 * user.init();
 */
async function init() {
  const users = await db.User.findAll();
  const plainUsers = users.map((user) => {
    const plainUser = user.get({ plain: true });
    this.stateManager.setState('user', plainUser.selector, plainUser);
    this.stateManager.setState('userById', plainUser.id, plainUser);
    return plainUser;
  });
  return plainUsers;
}

module.exports = {
  init,
};
