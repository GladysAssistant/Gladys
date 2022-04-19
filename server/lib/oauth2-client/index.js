const { executeQuery } = require('./oauth2.executeQuery');
const { deleteClient } = require('./oauth2.deleteClient');
const { getAccessToken } = require('./oauth2.getAccessToken');
const { buildAuthorizationUri } = require('./oauth2.buildAuthorizationUri');
const { buildRedirectUri } = require('./oauth2.buildRedirectUri');

const OAuth2Manager = function OAuth2Manager(variable) {
  this.variable = variable;
};

OAuth2Manager.prototype.executeQuery = executeQuery;
OAuth2Manager.prototype.deleteClient = deleteClient;
OAuth2Manager.prototype.getAccessToken = getAccessToken;
OAuth2Manager.prototype.buildAuthorizationUri = buildAuthorizationUri;
OAuth2Manager.prototype.buildRedirectUri = buildRedirectUri;

module.exports = OAuth2Manager;
