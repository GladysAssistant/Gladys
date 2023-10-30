const Promise = require('bluebird');

const db = require('../../models');

/**
 * @description Lock all sessions of all tablets of a house.
 * @param {string} houseId - Id of the house.
 * @returns {Promise} Return the revoked session.
 * @example
 * setTabletModeLocked('375223b3-71c6-4b61-a346-0a9d5baf12b4');
 */
async function setTabletModeLocked(houseId) {
  const sessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      current_house_id: houseId,
      revoked: false,
      tablet_mode: true,
    },
  });

  return Promise.mapSeries(sessions, async (session) => {
    // Lock tablet
    await session.update({ tablet_mode_locked: true });

    // Set cache to locked
    this.cache.set(`tablet_mode_locked:${session.id}`, true);

    return {
      id: session.id,
      tablet_mode_locked: true,
    };
  });
}

module.exports = {
  setTabletModeLocked,
};
