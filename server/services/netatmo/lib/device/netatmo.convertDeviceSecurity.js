const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/netatmo.constants');
const { buildFeatureWifiStrength } = require('./netatmo.buildFeaturesCommon');
const { buildFeatureCamera, buildFeatureStatus } = require('./netatmo.buildFeaturesSpecifSecurity');

/**
 * @description Transform Netatmo Security device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDeviceSecurity({ ... });
 */
function convertDeviceSecurity(netatmoDevice) {
  const { home: homeId, name, type: model, id, room = {}, vpn_url: vpnUrl, is_local: isLocal } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Security device "${name}, ${model}"`);
  const features = [];
  let params = [];
  const isNotBatteryDevice = model === SUPPORTED_MODULE_TYPE.NACAMERA;

  if (isNotBatteryDevice) {
    features.push(buildFeatureWifiStrength(name, externalId));
  }
  switch (model) {
    case SUPPORTED_MODULE_TYPE.NACAMERA: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      /* features specific Security */
      features.push(buildFeatureCamera(name, externalId));
      features.push(buildFeatureStatus(name, externalId));

      let cameraLiveUrl = `${vpnUrl}/live/files/high`;
      if (isLocal) {
        cameraLiveUrl = `${cameraLiveUrl}/index_local.m3u8`;
      } else {
        cameraLiveUrl = `${cameraLiveUrl}/index.m3u8`;
      }
      /* params */
      params = [
        { name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) },
        { name: PARAMS.CAMERA_URL, value: cameraLiveUrl },
        { name: PARAMS.CAMERA_ROTATION, value: 0 },
      ];
      break;
    }
    default:
      break;
  }
  /* params common to all devices features */
  params.push({ name: PARAMS.HOME_ID, value: homeId });
  if (room.id) {
    params.push({ name: PARAMS.ROOM_ID, value: room.id }, { name: PARAMS.ROOM_NAME, value: room.name });
  }
  const device = {
    name,
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    should_poll: false,
    features: features.filter((feature) => feature),
    params: params.filter((param) => param),
  };
  if (netatmoDevice.not_handled) {
    device.not_handled = true;
  }
  logger.info(`Netatmo Security device "${name}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceSecurity,
};
