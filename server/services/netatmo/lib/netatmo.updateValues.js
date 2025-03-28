const { default: axios } = require('axios');
const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, API, PARAMS } = require('./utils/netatmo.constants');
const { getCameraSnapshotUrl } = require('./utils/netatmo.getCameraSnapshotUrl');

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
  const { type: model, reachable } = deviceNetatmo;
  // const { type: model, reachable, vpn_url: vpnUrl = undefined, is_local: isLocal = undefined } = deviceNetatmo;
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  if (!reachable && typeof reachable !== 'undefined') {
    logger.info(`Netatmo device "${deviceGladys.name}" is not reachable`);
  }

  switch (model) {
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
    case SUPPORTED_MODULE_TYPE.NACAMERA: {
      await getCameraSnapshotUrl(this.gladys, deviceGladys, deviceNetatmo);
      await this.updateNACamera(deviceGladys, deviceNetatmo, externalId);
      break;
    }
    default:
      break;
  }
}

module.exports = {
  updateValues,
};
