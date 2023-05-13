const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { Error401 } = require('../../utils/httpErrors');
const { hashRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Validate an API key.
 * @param {string} apiKey - The api key of the user.
 * @param {Array} scope - The scope to allow.
 * @returns {Promise} Resolving with userId.
 * @example
 * gladys.session.validateApiKey('xxxx');
 */
async function validateApiKey(apiKey, scope) {
  const apiKeyHash = hashRefreshToken(apiKey);

  const session = await db.Session.findOne({
    where: {
      token_type: SESSION_TOKEN_TYPES.API_KEY,
      token_hash: apiKeyHash,
    },
  });

  if (session === null) {
    throw new Error401(`Api key not found`);
  }

  if (session.valid_until < new Date()) {
    throw new Error401(`Api key has expired`);
  }

  if (session.revoked) {
    throw new Error401(`Api key was revoked`);
  }

  return session.user_id;
}

module.exports = {
  validateApiKey,
};
