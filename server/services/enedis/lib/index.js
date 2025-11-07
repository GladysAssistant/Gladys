const { init } = require('./enedis.init');
const { sync } = require('./enedis.sync');

const EnedisHandler = function EnedisHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.syncDelayBetweenCallsInMs = 500;
  this.enedisSyncBatchSize = 1000;
};

EnedisHandler.prototype.init = init;
EnedisHandler.prototype.sync = sync;

module.exports = EnedisHandler;
