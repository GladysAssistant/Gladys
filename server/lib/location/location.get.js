const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get Location by user.
 * @param {string} userSelector - The selector of the user to get location from.
 * @param {string} [from] - Start date.
 * @param {string} [to] - End date.
 * @returns {Promise<Array>} Returns locations from this user.
 * @example
 * gladys.location.get('tony', '2019-04-02 04:41:09', '2019-04-02 04:41:09');
 */
async function get(userSelector, from, to) {
  const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
  // Default from date is one week ago
  const fromDate = from ? new Date(from) : new Date(oneWeekAgo);
  // default end date is now
  const toDate = to ? new Date(to) : new Date();
  const user = await db.User.findOne({
    where: {
      selector: userSelector,
    },
  });

  if (user === null) {
    throw new NotFoundError('User not found');
  }

  const locations = await db.Location.findAll({
    where: {
      user_id: user.id,
      created_at: {
        [Op.gte]: fromDate,
        [Op.lte]: toDate,
      },
    },
  });

  const locationsPlain = locations.map((location) => location.get({ plain: true }));

  return locationsPlain;
}

module.exports = {
  get,
};
