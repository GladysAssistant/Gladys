const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('./../bluetooth.constants');

/**
 * @description Try to discover Noble peripheral services.
 * @param {Object} service - Noble service.
 * @param {string[]} characteristicUuids - Requested characteristic uuids.
 * @returns {Promise<Object>} The map of characteristics by UUID.
 * @example
 * await discover({}, []);
 */
async function discoverCharacteristics(service, characteristicUuids) {
  const characteristicMap = {};
  logger.trace(`Bluetooth: discovering characteristics for service ${service.uuid}`);

  return new Promise((resolve, reject) => {
    service.discoverCharacteristics(characteristicUuids, (error, characteristics) => {
      if (error) {
        reject(new Error(`Bluetooth: error discovering characteristics for service ${service.uuid} - ${error}`));
      }

      if (characteristics.length === 0) {
        reject(new NotFoundError(`Bluetooth: no characteristics found for service ${service.uuid}`));
      }

      characteristics.forEach((characteristic) => {
        characteristicMap[characteristic.uuid] = characteristic;
      });

      logger.debug(`Bluetooth: all characteristics already found for service ${service.uuid}`);
      resolve(characteristicMap);
    });
  }).timeout(TIMERS.DISCOVER);
}

module.exports = {
  discoverCharacteristics,
};
