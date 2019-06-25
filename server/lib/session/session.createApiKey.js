const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');
const { generateApiKey } = require('../../utils/refreshToken');

/**
 * @description Create and save in database a new API key.
 * @param {string} userId - The uuid of a user.
 * @param {Array} scope - Scope the api key is able to access.
 * @returns {Promise} Resolving with the api key.
 * @example
 * gladys.session.createApiKey('7144a75d-1ec2-4f31-a587-a4b316c28754', ['dashboard:write']);
 */
async function createApiKey(userId, scope) {
  const { apiKey, apiKeyHash } = await generateApiKey();

  const newSession = {
    user_id: userId,
    token_type: SESSION_TOKEN_TYPES.API_KEY,
    token_hash: apiKeyHash,
    scope: scope.join(','),
    valid_until: null,
  };

  const session = await db.Session.create(newSession);

  return {
    api_key: apiKey,
    session_id: session.id,
  };
}

module.exports = {
  createApiKey,
};
