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
  // eslint-disable-next-line no-unneeded-ternary
  const binaryValue = event.last_value === 1 ? true : false;
  const point = new Point(event.device_feature)
    .tag('type', deviceFeature.type)
    .tag('name', deviceFeature.name)
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
}

module.exports = {
  writeBinary,
};
