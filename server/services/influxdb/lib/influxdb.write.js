const { Point } = require('@influxdata/influxdb-client');

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
}

module.exports = {
  write,
};
