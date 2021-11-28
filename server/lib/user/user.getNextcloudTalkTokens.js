const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Get all Nextcloud Talk Tokens
 * @example
 * gladys.user.getNextcloudTalkTokens();
 */
async function getNextcloudTalkTokens() {
  const where = {
    nextcloud_talk_token: {
      [Op.ne]: null,
    },
  };

  const users = await db.User.findAll({
    attributes: ['nextcloud_talk_token'],
    where,
  });

  const tokens = users.map((user) => user.get({ plain: true }).nextcloud_talk_token);
  return tokens;
}

module.exports = {
  getNextcloudTalkTokens,
};
