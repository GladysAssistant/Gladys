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

  if (classification.intent === 'scene.start') {
    try {
      if (!sceneEntity || !sceneEntity.option) {
        throw new NotFoundError('Scene not found');
      }
      logger.debug(`Starting scene ${sceneEntity.option}, original text = ${sceneEntity.sourceText}`);
      await this.execute(sceneEntity.option);
      this.message.replyByIntent(message, 'scene.start.success', context);
    } catch (e) {
      logger.debug(e);
      this.message.replyByIntent(message, 'scene.start.fail', context);
    }
  }

  return null;
}

module.exports = {
  command,
};
