const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function return a user by its Nextcloud Talk token
 * @name gladys.user.getByNextcloudTalkToken
 * @param {string} nextcloudTalkToken - The token of the user chat in Nextcloud Talk.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getByNextcloudTalkToken('xxxxxxxxxxx');
 *
 */
async function getByNextcloudTalkToken(nextcloudTalkToken) {
  const user = await db.User.findOne({
    where: { nextcloud_talk_token: nextcloudTalkToken },
    attributes: ['id', 'language'],
    raw: true,
  });
  if (user === null) {
    throw new NotFoundError(`User with nextcloud_talk_token "${nextcloudTalkToken}" not found`);
  }
  return user;
}

module.exports = {
  getByNextcloudTalkToken,
};
