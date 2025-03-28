const { fetch } = require('undici');
const logger = require('../../../../utils/logger');
const { PARAMS } = require('./netatmo.constants');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';

/**
 * @description Build the snapshot URL from Netatmo camera info.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - The device object.
 * @param {object} deviceNetatmo - The camera object returned by Netatmo API.
 */
async function getCameraSnapshotUrl(gladys, device, deviceNetatmo) {
  const { vpn_url: vpnUrl, is_local: isLocal, reachable, status } = deviceNetatmo;

  if (!vpnUrl) {
    logger.warn(`[Netatmo] No VPN URL for camera ${deviceNetatmo.name}`);
    return undefined;
  }

  // Préparer URL snapshot par défaut (VPN distant)
  const cameraUrlParam = device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_URL);
  // const currentCameraUrlParam = device.params.find(p => p.name === PARAMS.CAMERA_URL)?.value;
  let snapshotUrl = `${vpnUrl}/live/snapshot_720.jpg`;
  console.log('snapshotUrl', snapshotUrl);
  console.log('cameraUrlParam', cameraUrlParam);

  try {
    const response = await fetch(snapshotUrl, { method: 'HEAD' });
    if (response.ok && cameraUrlParam && cameraUrlParam.value && cameraUrlParam.value.length === 0) {
      console.log('response', response);
      return;
    }
    console.log('response', response);
    // sinon, on continue plus bas
  } catch (e) {
    logger.warn(`Camera snapshot URL failed: ${snapshotUrl}`, e);
  }

  console.log('snapshotUrl', snapshotUrl);
  console.log('isLocal', isLocal);
  console.log('reachable', reachable);
  console.log('vpnUrl', vpnUrl);
  if (isLocal && (reachable || status === 'on')) {
    try {
      // Étape 1 : ping sur l'URL VPN pour récupérer local_url
      const vpnPingRes = await fetch(`${vpnUrl}/command/ping`);
      const vpnPingJson = await vpnPingRes.json();
      console.log('vpnPingRes', vpnPingRes);
      console.log('vpnPingJson', vpnPingJson);
      if (!vpnPingJson.local_url) {
        if (cameraUrlParam !== snapshotUrl)
          snapshotUrl = `${vpnUrl}/live/index.m3u8`;
        logger.warn(`[Netatmo] No local_url in VPN ping for ${deviceNetatmo.name}`);
        await gladys.device.setParam(device, PARAMS.CAMERA_URL, vpnUrl);
        return snapshotUrl;
      }

      const localUrl = vpnPingJson.local_url;
      console.log('localUrl', localUrl);
      // Étape 2 : ping sur l'URL locale
      const localPingRes = await fetch(`${localUrl}/command/ping`);
      const localPingJson = await localPingRes.json();
      console.log('localPingRes', localPingRes);
      console.log('localPingJson', localPingJson);
      if (localPingJson.local_url === localUrl) {
        snapshotUrl = `${localUrl}/live/files/high/index.m3u8`;
        logger.error(`[Netatmo] Using local snapshot URL for ${deviceNetatmo.name}: ${snapshotUrl}`);
        await gladys.device.setParam(device, PARAMS.CAMERA_URL, snapshotUrl);
      } else {
        logger.debug(`[Netatmo] Local ping mismatch, fallback to VPN for ${deviceNetatmo.name}`);
      }
    } catch (e) {
      logger.warn(`[Netatmo] Error determining local snapshot URL for ${deviceNetatmo.name}: ${e.message}`);
      // Fallback sur VPN en cas d'erreur
    }
  } else if ((reachable || status === 'on') && cameraUrlParam !== `${vpnUrl}/live/index.m3u8`) {
    snapshotUrl = `${vpnUrl}/live/index.m3u8`;
    await gladys.device.setParam(device, PARAMS.CAMERA_URL, snapshotUrl);
  }
}

module.exports = {
  getCameraSnapshotUrl,
};
