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
    switch (classification.intent) {
      case 'light.turnon':
        await this.turnOn(context.device, context.deviceFeature);
        this.messageManager.replyByIntent(message, 'light.turn-on.success', context);
        break;
      default:
        throw new Error('Not found');
    }
  } catch (e) {
    logger.debug(e);
    this.messageManager.replyByIntent(message, 'light.turn-on.fail', context);
  }
}

module.exports = {
  command,
};
