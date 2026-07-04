const { fetch } = require('undici');
const fse = require('fs-extra');
const path = require('path');
const logger = require('../../../utils/logger');

const SNAPSHOT_PATH = '/live/snapshot_720.jpg';
const PING_PATH = '/command/ping';
const PING_TIMEOUT_MS = 5 * 1000;

/**
 * @description Download a camera snapshot through ffmpeg and return it as a base64 image.
 * The re-encoding (qscale 15, same as the rtsp-camera service) keeps the image under the
 * 150kB limit of the Gladys camera store, which the raw 720p snapshot can exceed.
 * @param {object} childProcess - Node child_process module.
 * @param {string} tempFolder - Gladys temp folder.
 * @param {string} cameraId - Netatmo camera id, used in the temp file name.
 * @param {string} baseUrl - Camera base URL (VPN or local).
 * @returns {Promise<string>} Base64 image.
 * @example
 * await takeSnapshot(childProcess, '/tmp/gladys', '70:ee:50:aa:bb:cc', 'https://prodvpn...');
 */
async function takeSnapshot(childProcess, tempFolder, cameraId, baseUrl) {
  const now = new Date();
  const filePath = path.join(
    tempFolder,
    `netatmo-camera-${cameraId.replace(/:/g, '-')}-${now.getTime()}-${Math.round(Math.random() * 10000)}.jpg`,
  );
  const args = ['-i', `${baseUrl}${SNAPSHOT_PATH}`, '-f', 'image2', '-vframes', '1', '-qscale:v', '15', filePath];
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'ffmpeg',
      args,
      {
        timeout: 20 * 1000, // 20 second max
      },
      async (error) => {
        // always settle the promise before cleaning up, so a cleanup failure
        // cannot leave the promise pending
        if (error) {
          reject(error);
          return fse.remove(filePath);
        }
        let image;
        try {
          image = await fse.readFile(filePath);
        } catch (e) {
          reject(e);
          return fse.remove(filePath);
        }
        const cameraImageBase = Buffer.from(image).toString('base64');
        resolve(`image/jpg;base64,${cameraImageBase}`);
        return fse.remove(filePath);
      },
    );
  });
}

/**
 * @description Resolve the base URL of a camera, preferring the local network when available.
 * The resolved local URL is cached per camera; the VPN URL is used as fallback.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @returns {Promise<string|undefined>} Camera base URL, or undefined without VPN URL.
 * @example
 * await this.getCameraBaseUrl(deviceNetatmo);
 */
async function getCameraBaseUrl(deviceNetatmo) {
  const { id, vpn_url: vpnUrl, is_local: isLocal } = deviceNetatmo;
  if (!vpnUrl) {
    return undefined;
  }
  if (!isLocal) {
    return vpnUrl;
  }
  const cachedUrl = this.cameraBaseUrls[id];
  if (cachedUrl) {
    return cachedUrl;
  }
  try {
    const vpnPingResponse = await fetch(`${vpnUrl}${PING_PATH}`, { signal: AbortSignal.timeout(PING_TIMEOUT_MS) });
    const { local_url: localUrl } = await vpnPingResponse.json();
    if (localUrl) {
      // Netatmo recommends validating the local URL by pinging it directly
      const localPingResponse = await fetch(`${localUrl}${PING_PATH}`, {
        signal: AbortSignal.timeout(PING_TIMEOUT_MS),
      });
      const localPingBody = await localPingResponse.json();
      if (localPingBody.local_url === localUrl) {
        logger.info(`Netatmo camera ${id}: local URL resolved, snapshots will use the local network`);
        this.cameraBaseUrls[id] = localUrl;
        return localUrl;
      }
    }
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: local URL resolution failed, using VPN URL: `, e.message);
  }
  logger.info(`Netatmo camera ${id}: snapshots will use the VPN URL`);
  return vpnUrl;
}

/**
 * @description Get the current image of a camera, trying the local network first then the VPN.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @returns {Promise<string|undefined>} Base64 image, or undefined if no image could be retrieved.
 * @example
 * await this.getCameraImage(deviceNetatmo);
 */
async function getCameraImage(deviceNetatmo) {
  const { id, vpn_url: vpnUrl } = deviceNetatmo;
  const baseUrl = await this.getCameraBaseUrl(deviceNetatmo);
  if (!baseUrl) {
    return undefined;
  }
  const { tempFolder } = this.gladys.config;
  try {
    return await takeSnapshot(this.childProcess, tempFolder, id, baseUrl);
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: snapshot failed on ${baseUrl}: `, e.message);
  }
  if (baseUrl === vpnUrl) {
    return undefined;
  }
  // the cached local URL is stale: forget it and fall back to the VPN URL
  delete this.cameraBaseUrls[id];
  try {
    return await takeSnapshot(this.childProcess, tempFolder, id, vpnUrl);
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: snapshot failed on VPN URL: `, e.message);
    return undefined;
  }
}

module.exports = {
  getCameraBaseUrl,
  getCameraImage,
};
