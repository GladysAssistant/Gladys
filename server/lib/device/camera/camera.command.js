const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
/**
 * @description Command a light.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * light.command(message, classification, context);
 */
async function command(message, classification, context) {
  let cameraImage;
  const roomEntity = classification.entities.find((entity) => entity.entity === 'room');
  try {
    switch (classification.intent) {
      case 'camera.get-image-room':
        if (!roomEntity) {
          throw new NotFoundError('Room not found');
        }
        cameraImage = await this.getImageInRoom(roomEntity.option);
        if (cameraImage) {
          this.messageManager.replyByIntent(message, 'camera.get-image-room.success', context, cameraImage);
        } else {
          this.messageManager.replyByIntent(message, 'camera.get-image-room.no-image-found', context);
        }
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, 'camera.get-image-room.fail', context);
  }
  return null;
}

module.exports = {
  command,
};
