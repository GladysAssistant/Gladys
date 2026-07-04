const logger = require('../../../../utils/logger');
const { getDeviceParam, setDeviceParam } = require('../../../../utils/device');
const { PARAMS, CAMERA_LIVE_QUALITIES, DEFAULT_CAMERA_LIVE_QUALITY } = require('../utils/netatmo.constants');

/**
 * @description Keep the CAMERA_URL device param pointing to the current live stream URL.
 * The dashboard camera box starts the live through the rtsp-camera service, which reads
 * this param; the Netatmo VPN URL rotates over time, so the param is refreshed at each poll.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @example updateCameraLiveUrl(deviceGladys, deviceNetatmo);
 */
async function updateCameraLiveUrl(deviceGladys, deviceNetatmo) {
  const baseUrl = await this.getCameraBaseUrl(deviceNetatmo);
  if (!baseUrl) {
    return;
  }
  const qualityParam = getDeviceParam(deviceGladys, PARAMS.CAMERA_QUALITY);
  const quality = CAMERA_LIVE_QUALITIES.includes(qualityParam) ? qualityParam : DEFAULT_CAMERA_LIVE_QUALITY;
  // the files/{quality} manifest variant (the one used by pyatmo/Home Assistant) works on both
  // the local and the VPN URLs, unlike the documented index_local.m3u8 which returns a 404
  // on current firmwares
  const liveUrl = `${baseUrl}/live/files/${quality}/index.m3u8`;
  if (getDeviceParam(deviceGladys, PARAMS.CAMERA_URL) === liveUrl) {
    return;
  }
  try {
    await this.gladys.device.setParam(deviceGladys, PARAMS.CAMERA_URL, liveUrl);
  } catch (e) {
    logger.error(`deviceGladys ${deviceNetatmo.type} - camera live URL: `, deviceGladys.name, 'error: ', e);
    return;
  }
  // setParam only writes to the database, while the rtsp-camera service reads the device
  // from the state manager: the in-memory param must be refreshed as well
  setDeviceParam(deviceGladys, PARAMS.CAMERA_URL, liveUrl);
}

module.exports = {
  updateCameraLiveUrl,
};
