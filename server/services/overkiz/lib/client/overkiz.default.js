
const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

class DefaultLoginHandler {
  constructor(server, username, password) {
    this.server = server;
    if(server.jwt === false || server.configuration === undefined) {
      throw new ServiceNotConfiguredError('');
    }
    this.username = username;
    this.password = password;
  }

  async login() {
    
  }
}

module.exports = {
  DefaultLoginHandler,
};