const { Point, HttpError, DEFAULT_WriteOptions } = require('@influxdata/influxdb-client');
const { Error422, Error404 } = require('../../../utils/httpErrors');

const logger = require('../../../utils/logger');

/**
 * @description On listening event.
 * @param {Object} event - Gladys event.
 * @example
 * influxdb.write(event);
 */
function write(event) {
  logger.trace('EVENT - Write point to influxdb');

  const gladysFeature = this.gladys.stateManager.get('deviceFeature', event.device_feature);
  const gladysDevice = this.gladys.stateManager.get('deviceById', gladysFeature.device_id);

  const point = new Point(event.device_feature)
    .measurement(gladysFeature.category)
    .tag('type', gladysFeature.type)
    .tag('name', gladysFeature.name)
    .tag('room', gladysDevice.room.name)
    .tag('device', gladysDevice.name)
    .tag('service', gladysDevice.service.name)
    .timestamp(gladysFeature.last_value_changed)
    .floatField('value', event.last_value);

  this.influxdbApi.writePoint(point);

  // control the way of how data are flushed
  if ((this.eventNumber + 1) % (DEFAULT_WriteOptions.batchSize + 1) === 0) {
    logger.info(`flush writeApi: chunk #${(this.eventNumber + 1) / (DEFAULT_WriteOptions.batchSize + 1)}`);
    try {
      // write the data to InfluxDB server, wait for it
      this.writeApi.flush();
    } catch (e) {
      if (e instanceof HttpError && e.statusCode === 422) {
        throw new Error422(`InfluxDB API - Unprocessable entity, maybe datatype problem`);
      } else if (e instanceof HttpError && e.statusCode === 404) {
        throw new Error404(`InfluxDB API - Server unreachable`);
      } else {
        logger.error(e);
      }
    }
  }
}

module.exports = {
  write,
};
