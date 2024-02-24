const { BadParameters } = require('../../../utils/coreErrors');
const { SUPPORTED_MODULE_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Save values of an Netatmo device.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateValues(deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(deviceGladys, deviceNetatmo, externalId) {
  const [prefix, topic] = externalId.split(':');
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  switch (deviceNetatmo.type) {
    case SUPPORTED_MODULE_TYPE.PLUG: {
      await this.updateNAPlug(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.THERMOSTAT: {
      await this.updateNATherm1(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.NRV: {
      await this.updateNRV(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    default:
      break;
  }
}

module.exports = {
  updateValues,
};
