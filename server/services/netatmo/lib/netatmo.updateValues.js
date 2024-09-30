const { default: axios } = require('axios');
const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, API, PARAMS } = require('./utils/netatmo.constants');

/**
 * @description Save values of an Netatmo device.
 * @param {object} device - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateValues(deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(device, deviceNetatmo, externalId) {
  let deviceGladys = device;
  const [prefix, topic] = externalId.split(':');
  const { type: model, reachable, vpn_url: vpnUrl = undefined, is_local: isLocal = undefined } = deviceNetatmo;
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  if (!reachable && typeof reachable !== 'undefined') {
    logger.info(`Netatmo device "${deviceGladys.name}" is not reachable`);
  }

  switch (deviceNetatmo.type) {
    case SUPPORTED_MODULE_TYPE.PLUG: {
      await this.updateNAPlug(deviceGladys, deviceNetatmo, externalId);
      break;
    }
  }
}

module.exports = {
  updateValues,
};
