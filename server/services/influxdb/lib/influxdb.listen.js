const { InfluxDB } = require('@influxdata/influxdb-client');
const { Agent } = require('http');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

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
    batchSize: 20,
    flushInterval: 60000,
    maxBufferLines: 100,
    maxRetries: 0,
    defaultTags: { host: 'gladys' },
  };

  // Node.js HTTP client OOTB does not reuse established TCP connections, a custom node HTTP agent
  // can be used to reuse them and thus reduce the count of newly established networking sockets
  const keepAliveAgent = new Agent({
    keepAlive: false, // reuse existing connections
    keepAliveMsecs: 20 * 1000, // 20 seconds keep alive
  });
  process.on('exit', () => keepAliveAgent.destroy());
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
    'ms',
    influxdbWriteOptions,
  );
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.write.bind(this)));
}

module.exports = {
  listen,
};
