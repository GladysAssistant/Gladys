const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function return a user picture.
 * @name gladys.user.getPicture
 * @param {string} id - The id of the user.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.getPicture('6b9bc8b7-b98d-4dda-b0fd-88fc10bd0b00');
 */
async function getPicture(id) {
  const user = await db.User.findByPk(id, {
    attributes: ['picture'],
  });
  if (user === null) {
    throw new NotFoundError(`User not found`);
  }
  return user.picture;
}

module.exports = {
  getPicture,
};
