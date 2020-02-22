const { generateRefreshToken } = require('../../utils/refreshToken');

/**
 * @description Invoked to generate a new refresh token.
 * @returns {Promise<string>} The generated refresh token.
 * @example
 * gladys.oauth.generateOAuthRefreshToken()
 */
async function generateOAuthRefreshToken() {
  const token = await generateRefreshToken();
  return token.refreshToken;
}

module.exports = {
  generateOAuthRefreshToken,
};
