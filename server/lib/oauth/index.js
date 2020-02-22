const OAuthServer = require('oauth2-server');
const { generateOAuthAccessToken } = require('./oauth.generateAccessToken');
const { generateOAuthRefreshToken } = require('./oauth.generateRefreshToken');
const { getAccessToken } = require('./oauth.getAccessToken');
const { getRefreshToken } = require('./oauth.getRefreshToken');
const { getAuthorizationCode } = require('./oauth.getAuthorizationCode');
const { getClient } = require('./oauth.getClient');
const { getUser } = require('./oauth.getUser');
const { getUserFromClient } = require('./oauth.getUserFromClient');
const { saveToken } = require('./oauth.saveToken');
const { saveAuthorizationCode } = require('./oauth.saveAuthorizationCode');
const { revokeToken } = require('./oauth.revokeToken');
const { revokeAuthorizationCode } = require('./oauth.revokeAuthorizationCode');
const { createClient } = require('./oauth.createClient');
const { getAllClients } = require('./oauth.getAllClients');
const { authenticate } = require('./oauth.authenticate');
const { authorize } = require('./oauth.authorize');
const { token } = require('./oauth.token');

/**
 * @description Centralize OAuth model require for 'oauth2-server' dependency.
 * @param {*} user - Gladys user manager.
 * @param {*} session - Gladys session manager.
 * @example
 * new OauthManager(gladys.user, gladys.session)
 *
 * @see https://oauth2-server.readthedocs.io/en/latest/model/spec.html#
 */
const OauthManager = function OauthManager(user, session) {
  this.user = user;
  this.session = session;

  this.oauthServer = new OAuthServer({
    model: this,
  });
};

// oauth2-server model
OauthManager.prototype.generateAccessToken = generateOAuthAccessToken;
OauthManager.prototype.generateRefreshToken = generateOAuthRefreshToken;
OauthManager.prototype.getAccessToken = getAccessToken;
OauthManager.prototype.getRefreshToken = getRefreshToken;
OauthManager.prototype.getAuthorizationCode = getAuthorizationCode;
OauthManager.prototype.getClient = getClient;
OauthManager.prototype.getUser = getUser;
OauthManager.prototype.getUserFromClient = getUserFromClient;
OauthManager.prototype.saveToken = saveToken;
OauthManager.prototype.saveAuthorizationCode = saveAuthorizationCode;
OauthManager.prototype.revokeToken = revokeToken;
OauthManager.prototype.revokeAuthorizationCode = revokeAuthorizationCode;
// Others
OauthManager.prototype.createClient = createClient;
OauthManager.prototype.getAllClients = getAllClients;
// Methods
OauthManager.prototype.authenticate = authenticate;
OauthManager.prototype.authorize = authorize;
OauthManager.prototype.token = token;

module.exports = OauthManager;
