/**
 * @description Tell if a session was revoked (logged out, password changed).
 * @param {string} sessionId - Uuid of the session.
 * @returns {boolean} True if the session was revoked.
 * @example
 * isRevoked('0a5f7305-4faf-42b3-aeb2-fbc0217c4855');
 */
function isRevoked(sessionId) {
  return this.cache.get(`revoked_session:${sessionId}`) === true;
}

module.exports = {
  isRevoked,
};
