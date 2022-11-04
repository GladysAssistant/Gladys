const { Point, HttpError } = require('@influxdata/influxdb-client');
const { Error422, Error404 } = require('../../../utils/httpErrors');
const logger = require('../../../utils/logger');

/**
 * @description Write float point to influxdb.
 * @param {Object} event - Gladys event.
 * @param {Object} deviceFeature - Gladys feature.
 * @param {Object} gladysDevice - Gladys device.
 * @example
 * influxdb.writeFloat(event, deviceFeature, gladysDevice);
 */
async function writeFloat(event, deviceFeature, gladysDevice) {
  const point = new Point(event.device_feature)
    .measurement(deviceFeature.category)
    .tag('type', deviceFeature.type)
    .tag('name', deviceFeature.name)
    .tag('room', gladysDevice.room.name)
    .tag('device', gladysDevice.name)
    .tag('service', gladysDevice.service.name)
    .floatField('value', event.last_value);

  this.influxdbApi.writePoint(point);
  this.influxdbApi
    .flush()
    .then(() => {
      logger.trace('FINISHED');
    })
    .catch((e) => {
      if (e instanceof HttpError && e.statusCode === 422) {
        throw new Error422(`InfluxDB API - Unprocessable entity, maybe datatype problem`);
      } else if (e instanceof HttpError && e.statusCode === 404) {
        throw new Error404(`InfluxDB API - Server unreachable`);
      } else {
        logger.error(e);
      }
    });
}

module.exports = {
  writeFloat,
};
