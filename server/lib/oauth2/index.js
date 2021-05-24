const { executeOauth2HTTPQuery } = require('./oauth2.executeOauth2HTTPQuery');
const { deleteClient } = require('./oauth2.deleteClient');

const OAuth2Manager = function OAuth2Manager(gladys) {
  this.gladys = gladys;
};

OAuth2Manager.prototype.executeOauth2HTTPQuery = executeOauth2HTTPQuery;
OAuth2Manager.prototype.deleteClient = deleteClient;

module.exports = OAuth2Manager;
