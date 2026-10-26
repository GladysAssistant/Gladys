const Promise = require('bluebird');
const { Op, QueryTypes } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');

const DAYS_TO_KEEP = 15;
const MAX_MESSAGES_PER_USER = 1000;

/**
 * @public
 * @description Purge old messages: messages older than 15 days are deleted,
 * and only the 1000 most recent messages are kept for each user.
 * @returns {Promise} Resolve.
 * @example
 * gladys.message.purge();
 */
async function purge() {
  const deleteBeforeDate = new Date(new Date().getTime() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
  logger.info(`Deleting all messages created before = ${deleteBeforeDate}`);
  await db.Message.destroy({
    where: {
      created_at: {
        [Op.lte]: deleteBeforeDate,
      },
    },
  });
  logger.info(`Keeping only the ${MAX_MESSAGES_PER_USER} most recent messages per user`);
  const users = await db.User.findAll({
    attributes: ['id'],
    raw: true,
  });
  await Promise.each(users, (user) =>
    db.sequelize.query(
      `DELETE FROM t_message WHERE id IN (
        SELECT id FROM t_message
        WHERE sender_id = :userId OR receiver_id = :userId
        ORDER BY created_at DESC, id DESC
        LIMIT -1 OFFSET :maxMessages
      )`,
      {
        replacements: { userId: user.id, maxMessages: MAX_MESSAGES_PER_USER },
        type: QueryTypes.DELETE,
      },
    ),
  );
  logger.info('Messages purged!');
}

module.exports = {
  purge,
};
