const { Point } = require('@influxdata/influxdb-client');

const { writeBinary } = require('./influxdb.writeBinary');

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

  let point;
  let binaryValue;
  switch (gladysFeature.type) {
    case 'binary':
      logger.trace('EVENT - Write point to influxdb - binary');
      binaryValue = event.last_value === 1 ? true : false;
      point = new Point(event.device_feature)
        .tag('type', gladysFeature.type)
        .tag('name', gladysFeature.name)
        .tag('room', gladysDevice.room.name)
        .booleanField('value', binaryValue);
      this.influxdbApi.writePoint(point);
      this.influxdbApi
        .flush()
        .then(() => {
          logger.trace('FINISHED');
        })
        .catch((e) => {
          logger.error(e);
          logger.error('Finished ERROR');
        });

      break;
    case 'integer':
      logger.trace('EVENT - Write point to influxdb - integer');
      break;
    default:
      logger.trace('unmanaged case');
  }
}

module.exports = {
  write,
};
