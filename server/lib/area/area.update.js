const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a area.
 * @param {string} selector - Area selector.
 * @param {object} area - The new area.
 * @returns {Promise<object>} Resolve with updated area.
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
  const plainArea = existingArea.get({ plain: true });

  // we update the area in memory
  const areaIndexInMemory = this.areas.findIndex((a) => a.id === plainArea.id);
  if (areaIndexInMemory !== -1) {
    this.areas[areaIndexInMemory] = plainArea;
  } else {
    this.areas.push(plainArea);
  }

  return plainArea;
}

module.exports = {
  update,
};
