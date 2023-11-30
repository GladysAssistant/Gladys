const { fake } = require('sinon');
const { STATUS } = require('../../../services/netatmo/lib/utils/netatmo.constants');

const NetatmoContext = function NetatmoContext(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.baseUrl = 'https://api.netatmo.net';

  this.configured = false;
  this.connected = false;
  this.redirectUri = null;
  this.stateGetAccessToken = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollEnergy = undefined;
  this.scopes = {
    netatmoEnergy: false,
  };
};

NetatmoContext.prototype.connect = fake.returns(null);
NetatmoContext.prototype.setTokens = fake.returns(null);
NetatmoContext.prototype.saveStatus = fake.returns(null);
NetatmoContext.prototype.init = fake.returns(null);
NetatmoContext.prototype.refreshingTokens = fake.returns({ success: false });
NetatmoContext.prototype.loadDevices = fake.returns(null);
NetatmoContext.prototype.disconnect = fake.returns(null);

module.exports = NetatmoContext;
