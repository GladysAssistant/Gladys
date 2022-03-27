const { executeOauth2HTTPQuery } = require('./oauth2.executeOauth2HTTPQuery');
const { deleteClient } = require('./oauth2.deleteClient');
const { getAccessToken } = require('./oauth2.getAccessToken');
const { buildAuthorizationUri } = require('./oauth2.buildAuthorizationUri');

const OAuth2Manager = function OAuth2Manager(variable) {
  this.variable = variable;
};

OAuth2Manager.prototype.executeOauth2HTTPQuery = executeOauth2HTTPQuery;
OAuth2Manager.prototype.deleteClient = deleteClient;
OAuth2Manager.prototype.getAccessToken = getAccessToken;
OAuth2Manager.prototype.buildAuthorizationUri = buildAuthorizationUri;

module.exports = OAuth2Manager;
