const { InfluxDB } = require('@influxdata/influxdb-client');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Instenciate influxdb lient and listen on state events.
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
  this.influxdbClient = new InfluxDB({ url: configuration.influxdbUrl, token: configuration.influxdbToken });
  this.influxdbApi = this.influxdbClient.getWriteApi(configuration.influxdbOrg, configuration.influxdbBucket);
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.write.bind(this)));
}

module.exports = {
  listen,
};
