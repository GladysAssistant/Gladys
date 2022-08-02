const { Point } = require('@influxdata/influxdb-client');
const logger = require('../../../utils/logger');

/**
 * @description Write integer point to influxdb.
 * @param {Object} event - Gladys event.
 * @param {Object} deviceFeature - Gladys feature.
 * @param {Object} gladysDevice - Gladys device.
 * @example
 * influxdb.writeInteger(event, deviceFeature, gladysDevice);
 */
async function writeInteger(event, deviceFeature, gladysDevice) {
  logger.debug('writeInteger function');

  const point = new Point(event.device_feature)
    .tag('type', deviceFeature.type)
    .tag('name', deviceFeature.name)
    .tag('room', gladysDevice.room.name)
    .intField('value', parseInt(event.last_value,event.last_value.length));

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
}

module.exports = {
  writeInteger,
};
