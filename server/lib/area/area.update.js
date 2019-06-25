const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a area.
 * @param {string} selector - Area selector.
 * @param {Object} area - The new area.
 * @example
 * gladys.area.update('my-area', {
 *    name: 'New name',
 * });
 */
async function update(selector, area) {
  const existingArea = await db.Area.findOne({
    where: {
      selector,
    },
  });

  if (existingArea === null) {
    throw new NotFoundError('Area not found');
  }

  await existingArea.update(area);

  return existingArea.get({ plain: true });
}

module.exports = {
  update,
};
