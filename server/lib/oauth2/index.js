const { executeQuery } = require('./oauth2.executeQuery');
const { saveVar } = require('./oauth2.saveVar');
const { deleteVar } = require('./oauth2.deleteVar');

const OAuth2Manager = function OAuth2Manager(gladys) {
  this.gladys = gladys;
};

OAuth2Manager.prototype.executeQuery = executeQuery;
OAuth2Manager.prototype.saveVar = saveVar;
OAuth2Manager.prototype.deleteVar = deleteVar;

module.exports = OAuth2Manager;
