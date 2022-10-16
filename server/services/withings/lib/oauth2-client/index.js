const { executeQuery } = require('./oauth2.executeQuery');
const { getCurrentConfig } = require('./oauth2.getCurrentConfig');
const { deleteClient } = require('./oauth2.deleteClient');
const { getAccessToken } = require('./oauth2.getAccessToken');
const { buildAuthorizationUri } = require('./oauth2.buildAuthorizationUri');
const { buildRedirectUri } = require('./oauth2.buildRedirectUri');

const OAuth2Manager = function OAuth2Manager(variable) {
  this.variable = variable;
  this.tokenHost = 'https://wbsapi.withings.net';
  this.tokenPath = '/v2/oauth2';
  this.authorizeHost = 'https://account.withings.com';
  this.authorizePath = '/oauth2_user/authorize2';
  this.additionalAccessTokenRequestActionParam = 'requesttoken';
  this.integrationScope = 'user.info,user.metrics,user.activity,user.sleepevents';
  this.grantType = 'authorization_code';
  this.additionalAccessTokenRequestAxtionParam = 'requesttoken';
};

OAuth2Manager.prototype.executeQuery = executeQuery;
OAuth2Manager.prototype.getCurrentConfig = getCurrentConfig;
OAuth2Manager.prototype.deleteClient = deleteClient;
OAuth2Manager.prototype.getAccessToken = getAccessToken;
OAuth2Manager.prototype.buildAuthorizationUri = buildAuthorizationUri;
OAuth2Manager.prototype.buildRedirectUri = buildRedirectUri;

module.exports = OAuth2Manager;
