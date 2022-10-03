const { sync } = require('./enedis.sync');

const EnedisHandler = function EnedisHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

EnedisHandler.prototype.sync = sync;

module.exports = EnedisHandler;
