/**
 * @description Invoked to retrieve the user associated with the specified client.
 * @param {Object} client - The client to retrieve the associated user for.
 * @returns {Promise} An Object representing the user,
 * or a falsy value if the client does not have an associated user.
 * The user object is completely transparent to oauth2-server
 * and is simply used as input to other model functions.
 * @example
 * oauth.getUserFromClient({
 *   client_id: 'my-client',
 *   user_id: 'the-user-id',
 * });
 */
async function getUserFromClient(client) {
  return this.user.getById(client.user_id);
}

module.exports = {
  getUserFromClient,
};
