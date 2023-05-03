const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to discover Noble peripheral services.
 * @param {object} service - Noble service.
 * @param {string[]} characteristicUuids - Requested characteristic uuids.
 * @returns {Promise<object>} The map of characteristics by UUID.
 * @example
 * await discover({}, []);
 */
async function discoverCharacteristics(service, characteristicUuids) {
  const characteristicMap = {};
  logger.trace(`Bluetooth: discovering characteristics for service ${service.uuid}`);

  return new Promise((resolve, reject) => {
    service.discoverCharacteristics(characteristicUuids, (error, characteristics) => {
      if (error) {
        return reject(new Error(`Bluetooth: error discovering characteristics for service ${service.uuid} - ${error}`));
      }

      if (characteristics.length === 0) {
        return reject(new NotFoundError(`Bluetooth: no characteristics found for service ${service.uuid}`));
      }

      characteristics.forEach((characteristic) => {
        characteristicMap[characteristic.uuid] = characteristic;
      });

      if (characteristicUuids) {
        const characteristicKeys = Object.keys(characteristicMap);
        if (!characteristicUuids.every((s) => characteristicKeys.includes(s))) {
          return reject(
            new NotFoundError(`Bluetooth: requested ${characteristicUuids} services not found for ${service.uuid}`),
          );
        }
      }

      logger.debug(`Bluetooth: all characteristics already found for service ${service.uuid}`);
      return resolve(characteristicMap);
    });
  }).timeout(TIMERS.DISCOVER);
}

module.exports = {
  discoverCharacteristics,
};
