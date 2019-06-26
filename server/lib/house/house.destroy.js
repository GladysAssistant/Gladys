const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Delete a house.
 * @param {string} selector - The selector of the use to delete.
 * @example
 * gladys.house.destroy('my-house');
 */
async function destroy(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  await house.destroy();
}

module.exports = {
  destroy,
};
