/**
 * @description Get the user.
 * @param {string} email - The email of the user.
 * @param {string} password - The password for his account.
 * @returns {any} The requested user, or false if not found.
 * @example
 * oauth.getUser('username@gladys.com', 'password');
 */
async function getUser(email, password) {
  try {
    return await this.user.login(email, password);
  } catch (e) {
    return false;
  }
}

module.exports = {
  getUser,
};
