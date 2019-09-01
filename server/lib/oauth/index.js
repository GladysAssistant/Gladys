const { getAccessToken } = require('./oauth.getAccessToken');
const { createClient } = require('./oauth.createClient');
const { getClient } = require('./oauth.getClient');
const { getAllClients } = require('./oauth.getAllClients');
const { getRefreshToken } = require('./oauth.getRefreshToken');
const { getUser } = require('./oauth.getUser');
const { saveAuthorizationCode } = require('./oauth.saveAuthorizationCode');
const { saveToken } = require('./oauth.saveToken');

const OauthManager = function OauthManager(user) {
  this.user = user;
};

OauthManager.prototype.getAccessToken = getAccessToken;
OauthManager.prototype.createClient = createClient;
OauthManager.prototype.getClient = getClient;
OauthManager.prototype.getAllClients = getAllClients;
OauthManager.prototype.getRefreshToken = getRefreshToken;
OauthManager.prototype.getUser = getUser;
OauthManager.prototype.saveAuthorizationCode = saveAuthorizationCode;
OauthManager.prototype.saveToken = saveToken;

module.exports = OauthManager;
