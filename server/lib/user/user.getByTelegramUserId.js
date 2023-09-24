const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function return a user by its Telegram user id.
 * @name gladys.user.getByTelegramUserId
 * @param {string} telegramUserId - The id of the user in Telegram.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getByTelegramUserId('xxxxxxxxxxx');
 */
async function getByTelegramUserId(telegramUserId) {
  const user = await db.User.findOne({
    where: { telegram_user_id: telegramUserId },
    attributes: [
      'id',
      'firstname',
      'lastname',
      'selector',
      'email',
      'language',
      'birthdate',
      'role',
      'temperature_unit_preference',
      'distance_unit_preference',
      'created_at',
      'updated_at',
    ],
  });
  if (user === null) {
    throw new NotFoundError(`User with telegram_user_id "${telegramUserId}" not found`);
  }
  return user.get({ plain: true });
}

module.exports = {
  getByTelegramUserId,
};
