const logger = require('../../../../utils/logger');
const { generate } = require('../../../../utils/password');

/**
 * @description Generates eWeLink login URL.
 * @param {object} params - EWeLink login configuration.
 * @param {string} [params.redirectUrl] - Login redirect URL.
 * @returns {string} Login URL.
 * @example
 * const loginURL = this.buildLoginUrl({ redirect_url: 'http://gladys' });
 */
function buildLoginUrl({ redirectUrl }) {
  logger.info('eWeLink: create new login URL');
  const state = generate(10, { number: true, lowercase: true, uppercase: true });
  this.loginState = state;
  return this.ewelinkWebAPIClient.oauth.createLoginUrl({
    redirectUrl,
    grantType: 'authorization_code',
    state,
  });
}

module.exports = {
  buildLoginUrl,
};
