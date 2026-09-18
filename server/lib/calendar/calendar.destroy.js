const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a calendar.
 * @param {string} selector - Calendar selector.
 * @param {string} [userId] - When provided, the calendar must belong to this user.
 * @example
 * gladys.calendar.destroy('my-calendar');
 */
async function destroy(selector, userId) {
  const calendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  if (calendar === null || (userId !== undefined && calendar.user_id !== userId)) {
    throw new NotFoundError('Calendar not found');
  }

  await calendar.destroy();
}

module.exports = {
  destroy,
};
