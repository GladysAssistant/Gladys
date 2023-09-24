const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @private
 * @description This function delete a user in DB and in state.
 * @name gladys.user.getById
 * @param {string} selector - The selector of the user.
 * @returns {Promise} Promise.
 * @example
 * await gladys.user.destroy('tony');
 */
async function destroy(selector) {
  const user = await db.User.findOne({
    where: {
      selector,
    },
  });
  if (user === null) {
    throw new NotFoundError('User not found');
  }
  await user.destroy();
  this.stateManager.deleteState('user', user.selector);
}

module.exports = {
  destroy,
};
