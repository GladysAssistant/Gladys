const queue = require('queue');

const { init } = require('./enedis.init');
const { sync } = require('./enedis.sync');

const { JOB_TYPES } = require('../../../utils/constants');

const EnedisHandler = function EnedisHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.syncDelayBetweenCallsInMs = 500;
  this.enedisSyncBatchSize = 1000;
  // @ts-ignore
  this.queue = queue({
    autostart: true,
    concurrency: 1,
  });
  this.sync = gladys.job.wrapper(JOB_TYPES.SERVICE_ENEDIS_SYNC, this.sync.bind(this));
};

EnedisHandler.prototype.init = init;
EnedisHandler.prototype.sync = sync;

module.exports = EnedisHandler;
