const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');

const TOKEN_VALIDITY_IN_SECONDS = 60 * 60; // 1 hour

/**
 * @description Generate a forgot password link and send it to the user.
 * @param {string} email - Email of the user who forgot his password.
 * @param {object} useragent - Device linked to this session.
 * @returns {Promise<object>} Resolve with created session.
 * @example
 * gladys.user.forgotPassword('test@test.fr', {});
 */
async function forgotPassword(email, useragent) {
  // look  if the user exist
  const user = await db.User.findOne({
    where: {
      email,
    },
  });

  if (user === null) {
    const users = await db.User.findAll();
    const usersListString = users.map((oneUser) => oneUser.email).join(',');
    logger.info('Just received a forgot password requests but the user is not found');
    logger.info(`Here is the list of users in database: ${usersListString}`);
    throw new NotFoundError('User not found');
  }

  // generate a session token
  const scope = ['reset-password:write'];
  return this.session.create(user.id, scope, TOKEN_VALIDITY_IN_SECONDS, useragent);
}

module.exports = {
  forgotPassword,
};
