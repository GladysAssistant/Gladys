const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
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
    case SUPPORTED_MODULE_TYPE.NAMAIN: {
      await this.updateNAMain(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE1: {
      await this.updateNAModule1(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE2: {
      await this.updateNAModule2(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE3: {
      await this.updateNAModule3(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMODULE4: {
      await this.updateNAModule4(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    default:
      break;
  }
}

module.exports = {
  updateValues,
};
