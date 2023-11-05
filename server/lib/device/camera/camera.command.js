const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
/**
 * @description Command a light.
 * @param {object} message - The message sent by the user.
 * @param {object} classification - The classification calculated by the brain.
 * @param {object} context - The context object containing found variables in question.
 * @returns {Promise} Resolve when command has been executed or failed.
 * @example
 * light.command(message, classification, context);
 */
async function command(message, classification, context) {
  const cameraImages = [];

  const roomEntity = classification.entities.find((entity) => entity.entity === 'room');
  const deviceEntity = classification.entities.find((entity) => entity.entity === 'device');

  try {
    switch (classification.intent) {
      case 'camera.get-image':
        if (roomEntity) {
          cameraImages.push(...(await this.getImagesInRoom(roomEntity.option)));
        } else if (deviceEntity) {
          cameraImages.push(await this.getImage(deviceEntity.option));
        } else {
          throw new NotFoundError('Room not found');
        }
        if (cameraImages.length) {
          cameraImages.forEach((cameraImage) => {
            this.messageManager.replyByIntent(message, 'camera.get-image.success', context, cameraImage);
          });
        } else {
          this.messageManager.replyByIntent(message, 'camera.get-image.no-image-found', context);
        }
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, 'camera.get-image.fail', context);
  }
  return null;
}

module.exports = {
  command,
};
