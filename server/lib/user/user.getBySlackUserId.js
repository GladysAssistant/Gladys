const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function return a user by its Slack user id
 * @name gladys.user.getBySlackUserId
 * @param {string} slackUserId - The id of the user in Slack.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getBySlackUserId('xxxxxxxxxxx');
 *
 */
async function getBySlackUserId(slackUserId) {
  const user = await db.User.findOne({
    where: { slack_user_id: slackUserId },
    attributes: ['id', 'language'],
    raw: true,
  });
  if (user === null) {
    throw new NotFoundError(`User with slack_user_id "${slackUserId}" not found`);
  }
  return user;
}

module.exports = {
  getBySlackUserId,
};
