const logger = require('../../../utils/logger');

/**
 * @description Command a light.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * light.command(message, classification, context);
 */
async function command(message, classification, context) {
  try {
    let cameraImage;
    switch (classification.intent) {
      case 'camera.get-image-room':
        cameraImage = await this.getImageInRoom(context.room);
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
}

module.exports = {
  command,
};
