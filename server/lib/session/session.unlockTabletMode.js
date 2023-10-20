const Promise = require('bluebird');

const db = require('../../models');

/**
 * @description Unlock all sessions of all tablets of a house.
 * @param {string} houseId - Id of the house.
 * @returns {Promise} Return the list of sessions affected.
 * @example
 * setTabletModeLocked('375223b3-71c6-4b61-a346-0a9d5baf12b4');
 */
async function unlockTabletMode(houseId) {
  const sessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      current_house_id: houseId,
      revoked: false,
      tablet_mode: true,
    },
  });

  return Promise.mapSeries(sessions, async (session) => {
    // Unlock tablet
    await session.update({ tablet_mode_locked: false });

    // Delete cache
    this.cache.del(`tablet_mode_locked:${session.id}`);

    return {
      id: session.id,
      tablet_mode_locked: false,
    };
  });
}

module.exports = {
  unlockTabletMode,
};
