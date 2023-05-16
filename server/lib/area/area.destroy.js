const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete an area.
 * @param {string} selector - Area selector.
 * @returns {Promise} Resolve when area is deleted.
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

  // remove the area from memory
  const areaIndexInMemory = this.areas.findIndex((a) => a.id === area.id);
  if (areaIndexInMemory !== -1) {
    this.areas.splice(areaIndexInMemory, 1);
  }

  return null;
}

module.exports = {
  destroy,
};
