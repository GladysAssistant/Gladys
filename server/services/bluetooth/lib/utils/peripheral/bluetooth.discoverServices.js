const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('./../bluetooth.constants');

/**
 * @description Try to discover Noble peripheral services.
 * @param {Object} peripheral - Noble peripheral.
 * @param {string[]} serviceUuids - Requested service uuids.
 * @returns {Promise<Object>} The map of services by UUID.
 * @example
 * await discoverServices(peripheral, ['2a29']);
 */
async function discoverServices(peripheral, serviceUuids) {
  const serviceMap = {};
  logger.trace(`Bluetooth: discovering services on ${peripheral.uuid}`, serviceUuids);

  return new Promise((resolve, reject) => {
    peripheral.discoverServices(serviceUuids, (error, services) => {
      if (error) {
        reject(new Error(`Bluetooth: error discovering services on ${peripheral.uuid} - ${error}`));
      }

      if (services.length === 0) {
        reject(new NotFoundError(`Bluetooth: no services found for ${peripheral.uuid}`));
      }

      services.forEach((service) => {
        serviceMap[service.uuid] = service;
      });

      logger.debug(`Bluetooth: all services found for ${peripheral.uuid}`);
      resolve(serviceMap);
    });
  }).timeout(TIMERS.DISCOVER);
}

module.exports = {
  discoverServices,
};
