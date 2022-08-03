const { writeBinary } = require('./influxdb.writeBinary');
const { writeFloat } = require('./influxdb.writeFloat');

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

  switch (gladysFeature.type) {
    case 'binary':
      logger.trace('EVENT - Write point to influxdb - binary');
      writeBinary.call(this, event, gladysFeature, gladysDevice);
      break;
    case 'index':
    case 'power':
    case 'integer':
    case 'voltage':
    case 'current':
    case 'decimal':
      logger.trace('EVENT - Write point to influxdb - decimal');
      writeFloat.call(this, event, gladysFeature, gladysDevice);
      break;
    default:
      logger.trace(`unmanaged case: ${gladysFeature.type}`);
  }
}

module.exports = {
  write,
};
