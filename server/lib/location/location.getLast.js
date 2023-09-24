const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get last location By User.
 * @param {string} userSelector - The selector of the user to get location from.
 * @returns {Promise<object>} Returns user last location.
 * @example
 * gladys.location.getLast('tony');
 */
async function getLast(userSelector) {
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
    },
    order: [['created_at', 'DESC']],
    limit: 1,
  });

  if (locations.length === 0) {
    throw new NotFoundError('User does not have any location yet.');
  }

  const location = locations[0];

  return location.get({ plain: true });
}

module.exports = {
  getLast,
};
