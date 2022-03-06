const { executeOauth2HTTPQuery } = require('./oauth2.executeOauth2HTTPQuery');
const { deleteClient } = require('./oauth2.deleteClient');
const { getAccesToken } = require('./oauth2.getAccesToken');
const { buildAuthorizationUri } = require('./oauth2.buildAuthorizationUri');

const OAuth2Manager = function OAuth2Manager(variable) {
  this.variable = variable;
};

OAuth2Manager.prototype.executeOauth2HTTPQuery = executeOauth2HTTPQuery;
OAuth2Manager.prototype.deleteClient = deleteClient;
OAuth2Manager.prototype.getAccesToken = getAccesToken;
OAuth2Manager.prototype.buildAuthorizationUri = buildAuthorizationUri;

module.exports = OAuth2Manager;
