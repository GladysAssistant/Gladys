/**
 * @description Invoked to retrieve a user using a username/password combination.
 * @param {string} username - The username of the user to retrieve.
 * @param {string} password - The user’s password.
 * @returns {Promise} An Object representing the user,
 * or a falsy value if no such user could be found.
 * The user object is completely transparent to oauth2-server
 * and is simply used as input to other model functions.
 * @example
 * oauth.getUser('username@gladys.com', 'password');
 */
async function getUser(username, password) {
  return this.user.login(username, password);
}

module.exports = {
  getUser,
};
