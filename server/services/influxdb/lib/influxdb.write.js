const { Point, HttpError } = require('@influxdata/influxdb-client');
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

  this.influxdbApi.useDefaultTags({ host: 'gladys' });

  const point = new Point(event.device_feature)
    .measurement(gladysFeature.category)
    .tag('type', gladysFeature.type)
    .tag('name', gladysFeature.name)
    .tag('room', gladysDevice.room.name)
    .tag('device', gladysDevice.name)
    .tag('service', gladysDevice.service.name);

  switch (gladysFeature.type) {
    case Number.isInteger(event.last_value): {
      logger.debug(`${gladysFeature.name} Integer identified`);
      point.intField('value', event.last_value);
      break;
    }
    case !Number.isInteger(event.last_value): {
      logger.debug(`${gladysFeature.name} Float identified`);
      point.floatField('value', event.last_value);
      break;
    }
    default:
      logger.warn(`Datatype unidentified for device ${gladysDevice.name} and feature ${gladysFeature.name}`);
  }

  if (point.floatField || point.intField) {
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
  } else {
    logger.warn(`Nothing to do for ${gladysDevice.name} and feature ${gladysFeature.name}`);
  }
}

module.exports = {
  write,
};
