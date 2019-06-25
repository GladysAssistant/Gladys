const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete an area.
 * @param {string} selector - Area selector.
 * @example
 * gladys.area.destroy('my-area');
 */
async function destroy(selector) {
  const area = await db.Area.findOne({
    where: {
      selector,
    },
  });

  if (area === null) {
    throw new NotFoundError('Area not found');
  }

  await area.destroy();
}

module.exports = {
  destroy,
};
