/**
 * @description Return the number of users in this instance.
 * @returns {number} Return the number of users.
 * @example
 * const nbOfUser = user.getUserCount();
 */
function getUserCount() {
  return Object.keys(this.stateManager.state.user).length;
}

module.exports = {
  getUserCount,
};
