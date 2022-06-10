const { write } = require('./influxdb.write');
const { listen } = require('./influxdb.listen');
const { InfluxDB } = require('@influxdata/influxdb-client');
const logger = require('../../../utils/logger');



/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @param {string} influxdbUrl - The url of the influxdb instance.
 * @param {string} influxdbToken - The token of the influxdb instance.
 * @param {string} influxdbOrg - The organization of the influxdb instance.
 * @param {string} influxdbBucket - The bucket of the influxdb instance.
 * @description This function starts the InfluxDB service.
 * @example
 * InfluxdbManager(gladys, serviceId, influxdbClient, influxdbApi, influxdbOrg, influxdbBucket)
 */
const InfluxdbManager = function InfluxdbManager(gladys, serviceId, influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  logger.debug('InfluxdbManager - influxdbUrl:', influxdbUrl);
  logger.debug('InfluxdbManager - influxdbToken:', influxdbToken);
  logger.debug('InfluxdbManager - influxdbOrg:', influxdbOrg);
  logger.debug('InfluxdbManager - influxdbBucket:', influxdbBucket);
  this.influxdbClient = new InfluxDB({ url: influxdbUrl, token: influxdbToken });;
  this.influxdbApi = this.influxdbClient.getWriteApi(influxdbOrg, influxdbBucket);
};

InfluxdbManager.prototype.write = write;
InfluxdbManager.prototype.listen = listen;

module.exports = InfluxdbManager;
