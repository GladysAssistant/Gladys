const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get an area by selector.
 * @param {string} selector - Area selector.
 * @returns {Promise<object>} Return area.
 * @example
 * area.getBySelector('test-area');
 */
async function getBySelector(selector) {
  const area = await db.Area.findOne({
    where: {
      selector,
    },
  });

  if (area === null) {
    throw new NotFoundError('Area not found');
  }

  return area.get({ plain: true });
}

module.exports = {
  getBySelector,
};
