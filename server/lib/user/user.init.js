const db = require('../../models');
const logger = require('../../utils/logger');

// Signature of the temporary account that older versions of the signup flow
// created before restoring a Gladys Plus backup. Its credentials were
// hardcoded (and public), so it must not be kept around.
const TEMP_RESTORE_USER_EMAIL = 'temp-user@test.fr';
const TEMP_RESTORE_USER_NAME = 'temp-user';

/**
 * @description Load all users from the database.
 * @returns {Promise} Resolve when success.
 * @example
 * user.init();
 */
async function init() {
  const users = await db.User.findAll();
  // If the only user on the instance is the temporary account left by an
  // aborted Gladys Plus restore during signup, we delete it so the instance
  // goes back to the "not configured" state and the signup flow is
  // accessible again.
  if (
    users.length === 1 &&
    users[0].email === TEMP_RESTORE_USER_EMAIL &&
    users[0].firstname === TEMP_RESTORE_USER_NAME &&
    users[0].lastname === TEMP_RESTORE_USER_NAME
  ) {
    logger.info('Deleting temporary account left by an aborted Gladys Plus restore during signup.');
    await users[0].destroy();
    return [];
  }
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
