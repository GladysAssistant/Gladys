/**
 * @description Setup Pushover API
 * @param {string} token - Pushover API token.
 * @param {string} user - Pushover User token.
 * @example
 * setup('test', 'test');
 */
async function setup(token, user) {
  this.token = token;
  this.user = user;
}

module.exports = {
  setup,
};
