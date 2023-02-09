const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');
/**
 * @description Command a scene.
 * @param {Object} message - The message sent by the user.
 * @param {Object} classification - The classification calculated by the brain.
 * @param {Object} context - The context object containing found variables in question.
 * @example
 * command(message, classification, context);
 */
async function command(message, classification, context) {
  const sceneEntity = classification.entities.find((entity) => entity.entity === 'scene');
  try {
    switch (classification.intent) {
      case 'scene.start':
        if (!sceneEntity) {
          throw new NotFoundError('Scene not found');
        }
        await this.execute(sceneEntity.option);
        this.messageManager.replyByIntent(message, 'scene.start.success', context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, 'scene.start.fail', context);
  }
  return null;
}

module.exports = {
  command,
};
