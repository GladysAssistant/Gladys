const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Set tablet model.
 * @param {string} userId - Id of the user.
 * @param {string} sessionId - Uuid of the session.
 * @param {boolean} tabletMode - Tablet mode or not.
 *  @param {string} houseSelector - House to set.
 * @returns {Promise} Return updated session.
 * @example
 * setTabletMode('375223b3-71c6-4b61-a346-0a9d5baf12b4', '0a5f7305-4faf-42b3-aeb2-fbc0217c4855');
 */
async function setTabletMode(userId, sessionId, tabletMode, houseSelector) {
  const session = await db.Session.findOne({
    attributes: ['id'],
    where: {
      id: sessionId,
      user_id: userId,
    },
  });

  if (session === null) {
    throw new NotFoundError('Session not found');
  }

  let houseId = null;

  // Find house by selector if house is provided
  if (houseSelector) {
    const house = await db.House.findOne({
      where: {
        selector: houseSelector,
      },
    });

    if (house === null) {
      throw new NotFoundError('House not found');
    }

    houseId = house.id;
  }

  // Set tablet mode
  await session.update({ tablet_mode: tabletMode, current_house_id: houseId });

  return {
    id: session.id,
    tablet_mode: tabletMode,
    current_house_id: houseId,
  };
}

module.exports = {
  setTabletMode,
};
