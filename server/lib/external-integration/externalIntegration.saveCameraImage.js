const { BadParameters, NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');
const { MAX_CAMERA_IMAGES_PER_MINUTE, MAX_CAMERA_IMAGE_SIZE } = require('./constants');

/**
 * @description Save a new camera image published by an integration
 * (POST /camera/image of the host API), mapped on
 * gladys.device.camera.setImage — the same format and path as the internal
 * camera services (image/jpg;base64,..., 150 KB core bound, dedicated
 * saveStringState path): the dashboard camera widget updates in real time,
 * and images NEVER go through POST /state (no state history, no state rate
 * limit). Rate limited to 12 images/minute per device (one every 5s —
 * continuous video streaming is not the v1 scope).
 * @param {object} service - The external integration service.
 * @param {object} body - The published image.
 * @param {string} body.device_external_id - External id of the camera device.
 * @param {string} body.image - The image (image/jpg;base64,...).
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.saveCameraImage(service, {
 *   device_external_id: 'ext:tuya-demo:cam',
 *   image: 'image/jpg;base64,/9j/4AAQ...',
 * });
 */
async function saveCameraImage(service, { device_external_id: deviceExternalId, image } = {}) {
  if (typeof deviceExternalId !== 'string' || deviceExternalId.length === 0) {
    throw new BadParameters('device_external_id: must be a non-empty string');
  }
  if (typeof image !== 'string' || image.length === 0) {
    throw new BadParameters('image: must be a non-empty string');
  }
  if (image.length > MAX_CAMERA_IMAGE_SIZE) {
    // same bound as the core (camera.setImage), checked here so the host
    // API answers before any device lookup
    throw new BadParameters(`image: must be at most ${MAX_CAMERA_IMAGE_SIZE} bytes`);
  }
  const device = this.stateManager.get('deviceByExternalId', deviceExternalId);
  if (device === null || device.service_id !== service.id) {
    // a device of another integration stays invisible: same 404 as unknown
    throw new NotFoundError('CAMERA_NOT_FOUND');
  }
  const cameraFeature = (device.features || []).find(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.CAMERA && feature.type === DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
  );
  if (!cameraFeature) {
    throw new BadParameters(`device ${deviceExternalId} has no camera image feature`);
  }
  // fixed one-minute window rate limit, in memory per device
  const now = Date.now();
  let rateLimit = this.cameraImageRateLimits.get(deviceExternalId);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    this.cameraImageRateLimits.set(deviceExternalId, rateLimit);
  }
  if (rateLimit.count + 1 > MAX_CAMERA_IMAGES_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_CAMERA_IMAGES_PER_MINUTE} images per minute per device`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
  await this.device.camera.setImage(device.selector, image);
  return { success: true };
}

module.exports = {
  saveCameraImage,
};
