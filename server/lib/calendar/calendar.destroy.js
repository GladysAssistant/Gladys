const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a calendar.
 * @param {string} selector - Calendar selector.
 * @example
 * gladys.calendar.destroy('my-calendar');
 */
async function destroy(selector) {
  const calendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  if (calendar === null) {
    throw new NotFoundError('Calendar not found');
  }

  await calendar.destroy();
}

module.exports = {
  destroy,
};
