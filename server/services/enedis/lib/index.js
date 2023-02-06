const { sync } = require('./enedis.sync');

const EnedisHandler = function EnedisHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.syncDelayBetweenCallsInMs = 500;
};

EnedisHandler.prototype.sync = sync;

module.exports = EnedisHandler;
