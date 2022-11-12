const { InfluxDB } = require('@influxdata/influxdb-client');
const { Agent } = require('http');
const Bottleneck = require('bottleneck/es5');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');


const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100000,
});

/**
 * @description Instenciate influxdb client and listen on state events.
 * @param {Object} configuration - InfluxDB configuration.
 * @example
 * influxdb.listen();
 */
function listen(configuration) {
  logger.info('listen function');
  if (!configuration.influxdbUrl) {
    this.configured = false;
    throw new ServiceNotConfiguredError('InfluxDB service is not configured.');
  }
  this.configured = true;

  const influxdbWriteOptions = {
    defaultTags: { host: 'gladys' },
  };

  // Node.js HTTP client OOTB does not reuse established TCP connections, a custom node HTTP agent
  // can be used to reuse them and thus reduce the count of newly established networking sockets
  const keepAliveAgent = new Agent({
    keepAlive: false, // reuse existing connections
    keepAliveMsecs: 20 * 1000, // 20 seconds keep alive
  });
  process.on('exit', () => keepAliveAgent.destroy());
  this.eventNumber = 0;
  this.influxdbClient = new InfluxDB({
    url: configuration.influxdbUrl,
    token: configuration.influxdbToken,
    transportOptions: {
      agent: keepAliveAgent,
    },
  });
  this.influxdbApi = this.influxdbClient.getWriteApi(
    configuration.influxdbOrg,
    configuration.influxdbBucket,
    'ns',
    influxdbWriteOptions,
  );
  logger.info(this.influxdbApi);
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.write.bind(this)));
  limiter.wrap(this.influxdbApi.flush());
}

module.exports = {
  listen,
};
