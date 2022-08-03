const { Point } = require('@influxdata/influxdb-client');
const logger = require('../../../utils/logger');

/**
 * @description Write binary point to influxdb.
 * @param {Object} event - Gladys event.
 * @param {Object} deviceFeature - Gladys feature.
 * @param {Object} gladysDevice - Gladys device.
 * @example
 * influxdb.writeBinary(event, deviceFeature, gladysDevice);
 */
async function writeBinary(event, deviceFeature, gladysDevice) {
  logger.debug('writeBinary function');
  const point = new Point(event.device_feature)
    .measurement(deviceFeature.category)
    .tag('type', deviceFeature.type)
    .tag('name', deviceFeature.name)
    .tag('room', gladysDevice.room.name)
    .tag('device', gladysDevice.name)
    .tag('service', gladysDevice.service.name)
    .booleanField('value', !!event.last_value);

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
  writeBinary,
};
