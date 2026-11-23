const db = require('../../../models');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isCameraEnabled } = require('../../../utils/device');

/**
 * @description Get a fresh image from each enabled camera of a room. Every camera is asked
 * for a live image at the same time (camera.getLiveImage): a camera that only has an image
 * when a picture is taken, like an external integration camera, gets one now. When the live
 * request fails or times out, the last image stored for that camera is used instead, if it
 * is less than one hour old (camera.getImage). Disabled cameras are skipped, their stored
 * image included (spec docs/specs/camera-enable-disable.md).
 * @param {string|null} roomId - Id of the room, null for the cameras assigned to no room.
 * @returns {Promise<Array<string>>} Resolve with the images found, one per camera at most.
 * @example
 * getLiveImagesInRoom('f0dea887-d14f-4344-a57b-795c16e0abda');
 */
async function getLiveImagesInRoom(roomId) {
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

  const images = await Promise.all(
    selectors.map(async (selector) => {
      const device = this.stateManager.get('device', selector);
      if (device === null || !isCameraEnabled(device)) {
        return null;
      }
      try {
        return await this.getLiveImage(selector);
      } catch (e) {
        logger.warn(`Camera "${selector}": no live image (${e.message}), trying its last stored image`);
      }
      try {
        return await this.getImage(selector);
      } catch (e) {
        logger.debug(`Camera "${selector}": no stored image either (${e.message})`);
        return null;
      }
    }),
  );

  return images.filter(Boolean);
}

module.exports = {
  getLiveImagesInRoom,
};
