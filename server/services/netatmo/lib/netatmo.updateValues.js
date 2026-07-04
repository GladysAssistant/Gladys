const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

/**
 * @description Save values of an Netatmo device.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateValues(deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(deviceGladys, deviceNetatmo, externalId) {
  const [prefix, topic] = externalId.split(':');
  const { reachable } = deviceNetatmo;
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  if (!reachable && typeof reachable !== 'undefined') {
    logger.info(`Netatmo device "${deviceGladys.name}" is not reachable`);
  }

  await this.updateDevice(deviceGladys, deviceNetatmo, externalId);
}

module.exports = {
  updateValues,
};
