const { fetch } = require('undici');
const logger = require('../../../utils/logger');

const SNAPSHOT_PATH = '/live/snapshot_720.jpg';
const PING_PATH = '/command/ping';

/**
 * @description Fetch a camera snapshot and return it as a base64 image.
 * @param {string} baseUrl - Camera base URL (VPN or local).
 * @returns {Promise<string|undefined>} Base64 image, or undefined if the snapshot is not available.
 * @example
 * await fetchSnapshot('https://prodvpn-eu-14.netatmo.net/restricted/...');
 */
async function fetchSnapshot(baseUrl) {
  const response = await fetch(`${baseUrl}${SNAPSHOT_PATH}`);
  if (!response.ok) {
    logger.debug(`Netatmo camera snapshot failed with HTTP ${response.status} on ${baseUrl}`);
    return undefined;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return `image/jpg;base64,${buffer.toString('base64')}`;
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
    const vpnPingResponse = await fetch(`${vpnUrl}${PING_PATH}`);
    const { local_url: localUrl } = await vpnPingResponse.json();
    if (localUrl) {
      // Netatmo recommends validating the local URL by pinging it directly
      const localPingResponse = await fetch(`${localUrl}${PING_PATH}`);
      const localPingBody = await localPingResponse.json();
      if (localPingBody.local_url === localUrl) {
        this.cameraBaseUrls[id] = localUrl;
        return localUrl;
      }
    }
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: local URL resolution failed, using VPN URL: `, e.message);
  }
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
  try {
    const image = await fetchSnapshot(baseUrl);
    if (image) {
      return image;
    }
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: snapshot failed on ${baseUrl}: `, e.message);
  }
  if (baseUrl === vpnUrl) {
    return undefined;
  }
  // the cached local URL is stale: forget it and fall back to the VPN URL
  delete this.cameraBaseUrls[id];
  try {
    return await fetchSnapshot(vpnUrl);
  } catch (e) {
    logger.debug(`Netatmo camera ${id}: snapshot failed on VPN URL: `, e.message);
    return undefined;
  }
}

module.exports = {
  getCameraBaseUrl,
  getCameraImage,
};
