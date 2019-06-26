const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const TOKEN_VALIDITY_IN_SECONDS = 60 * 60; // 1 hour

/**
 * @description Generate a forgot password link and send it to the user.
 * @param {string} email - Email of the user who forgot his password.
 * @example
 * gladys.user.forgotPassword('test@test.fr');
 */
async function forgotPassword(email) {
  // look  if the user exist
  const user = await db.User.findOne({
    where: {
      email,
    },
  });

  if (user === null) {
    throw new NotFoundError('User not found');
  }

  // generate a session token
  const scope = ['reset-password:write'];
  return this.session.create(user.id, scope, TOKEN_VALIDITY_IN_SECONDS);
}

module.exports = {
  forgotPassword,
};
