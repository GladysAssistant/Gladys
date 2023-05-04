const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Get users at home.
 * @param {string} selector - Selector of the house.
 * @returns {Promise<Array>} Return list of users at home.
 * @example
 * const users = await gladys.house.getUsersAtHome('my-house');
 */
async function getUsersAtHome(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.User,
        as: 'users_at_home',
        attributes: ['id', 'firstname', 'lastname', 'selector', 'picture'],
      },
    ],
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  const housePlain = house.get({ plain: true });

  return housePlain.users_at_home;
}

module.exports = {
  getUsersAtHome,
};
