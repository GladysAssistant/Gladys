const { default: axios } = require('axios');
const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, API, PARAMS } = require('./utils/netatmo.constants');

/**
 * @description Save values of an Netatmo device.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateValues(deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(deviceGladys, deviceNetatmo, externalId) {
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
  } else {
    const isCameraDevice = model === SUPPORTED_MODULE_TYPE.NACAMERA;
    if (isCameraDevice) {
      /*
        vpn_url example: 
          'https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,'
          ou 'https://prodvpn-eu-2.netatmo.net/restricted/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,'
        'local_url example:
          'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx
      */
      const partsVpnUrl = vpnUrl.split('/');
      const videoId = partsVpnUrl[partsVpnUrl.length - 2];

      const cameraUrl = deviceGladys.params.find((param) => param.name === PARAMS.CAMERA_URL);
      const cameraLiveUrl = deviceGladys.params.find((param) => param.name === PARAMS.CAMERA_LIVE_URL);
      if (
        !cameraUrl.value ||
        !cameraUrl.value.includes(videoId) ||
        !cameraLiveUrl.value ||
        (cameraLiveUrl.value.includes('https') && isLocal)
      ) {
        const responsePingCamera = await axios({
          url: `${vpnUrl}/command/ping`,
          method: 'get',
          headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
        });
        const { local_url: localUrl } = responsePingCamera.data;
        const responsePingLocalCamera = await axios({
          url: `${localUrl}/command/ping`,
          method: 'get',
          headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
        });
        const { local_url: responseLocalUrl } = responsePingLocalCamera.data;
        let cameraUrlDeviceNetatmo;
        let cameraLiveUrlDeviceNetatmo;
        if (responseLocalUrl === localUrl) {
          cameraUrlDeviceNetatmo = `${localUrl}/live/snapshot_720.jpg`;
          cameraLiveUrlDeviceNetatmo = `${localUrl}/live/files/high/index.m3u8`;
        } else {
          cameraUrlDeviceNetatmo = `${vpnUrl}/live/snapshot_720.jpg`;
          cameraLiveUrlDeviceNetatmo = `${vpnUrl}/live/files/high/index.m3u8`;
        }
        await this.gladys.device.setParam(deviceGladys, PARAMS.CAMERA_URL, cameraUrlDeviceNetatmo);
        await this.gladys.device.setParam(deviceGladys, PARAMS.CAMERA_LIVE_URL, cameraLiveUrlDeviceNetatmo);
        deviceGladys = await this.gladys.stateManager.get('deviceByExternalId', externalId);
      }
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
        await this.updateNACamera(deviceGladys, deviceNetatmo, externalId);
        break;
      }
      default:
        break;
    }
  }
}

module.exports = {
  updateValues,
};
