const Promise = require('bluebird');
const db = require('../../../models');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isCameraEnabled } = require('../../../utils/device');

// A live image can be one ffmpeg process per camera for up to 20 s (rtsp-camera):
// a room with many cameras, such as "No room", is asked a few cameras at a time.
const MAX_LIVE_IMAGES_IN_PARALLEL = 3;

/**
 * @description Tell if a device is a camera Gladys may use: known and not disabled
 * (spec docs/specs/camera-enable-disable.md).
 * @param {object|null} device - The device from the state manager.
 * @returns {boolean} True when the camera can serve an image.
 * @example
 * isUsableCamera(stateManager.get('device', 'my-camera'));
 */
function isUsableCamera(device) {
  return device !== null && isCameraEnabled(device);
}

/**
 * @description Get a fresh image from each enabled camera of a room. The cameras are asked
 * for a live image (camera.getLiveImage), a few at a time: a camera that only has an image
 * when a picture is taken, like an external integration camera, gets one now. When the live
 * request fails or times out, or when the camera's service cannot take a picture on request
 * (a camera that publishes its images, like an MQTT one), the last image stored for that
 * camera is used instead, if it is less than one hour old (camera.getImage). Disabled cameras
 * are skipped, their stored image included, and so is a camera disabled while its picture was
 * being taken (spec docs/specs/camera-enable-disable.md).
 * @param {string|null} roomId - Id of the room, null for the cameras assigned to no room.
 * @returns {Promise<Array<string>>} Resolve with the images found, one per camera at most.
 * @example
 * getLiveImagesInRoom('f0dea887-d14f-4344-a57b-795c16e0abda');
 */
async function getLiveImagesInRoom(roomId) {
  // undefined is not a room: Sequelize would drop the condition and select every camera.
  if (roomId === undefined) {
    return [];
  }
  const imageFeatures = await db.DeviceFeature.findAll({
    attributes: ['device_id'],
    where: {
      category: DEVICE_FEATURE_CATEGORIES.CAMERA,
      type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
    },
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['selector'],
        where: {
          room_id: roomId,
        },
      },
    ],
  });
  const selectors = [...new Set(imageFeatures.map((imageFeature) => imageFeature.device.selector))];

  const images = await Promise.map(
    selectors,
    async (selector) => {
      const device = this.stateManager.get('device', selector);
      if (!isUsableCamera(device)) {
        return null;
      }
      const service = this.serviceManager.getServiceById(device.service_id);
      if (typeof service?.device?.getImage === 'function') {
        try {
          const liveImage = await this.getLiveImage(selector);
          // The capture can last up to 20 s: a camera disabled meanwhile (private mode)
          // must not have its picture returned, nor its stored one.
          return isUsableCamera(this.stateManager.get('device', selector)) ? liveImage : null;
        } catch (e) {
          logger.warn(`Camera "${selector}": no live image (${e.message}), trying its last stored image`);
        }
      }
      try {
        return await this.getImage(selector);
      } catch (e) {
        logger.debug(`Camera "${selector}": no stored image either (${e.message})`);
        return null;
      }
    },
    { concurrency: MAX_LIVE_IMAGES_IN_PARALLEL },
  );

  return images.filter(Boolean);
}

module.exports = {
  getLiveImagesInRoom,
  MAX_LIVE_IMAGES_IN_PARALLEL,
};
