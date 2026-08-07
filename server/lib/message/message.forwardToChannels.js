const Promise = require('bluebird');

const logger = require('../../utils/logger');

/**
 * @description Forward a message to the outbound channels of a user: every
 * service in the stateManager exposing `message.sendToUser(user, message)`
 * is called; each service resolves its own identity for the user and no-ops
 * when the user is not linked. The core does not know any channel by name —
 * telegram, nextcloud-talk, callmebot and external "communication"
 * integrations all go through this same interface. A failing channel never
 * prevents the others.
 *
 * When `serviceName` is given, the message goes to that single channel: a
 * scene action can pick where it talks instead of broadcasting. An unknown
 * or non-messaging service name is logged and dropped rather than silently
 * falling back to a broadcast the user did not ask for.
 * @param {object} user - The Gladys user.
 * @param {object} message - The message to forward.
 * @param {string} [serviceName] - Restrict the forward to this service name.
 * @returns {Promise} Resolve when every channel was tried.
 * @example
 * await this.forwardToChannels(user, messageCreated, 'telegram');
 */
async function forwardToChannels(user, message, serviceName = null) {
  const serviceNames = serviceName ? [serviceName] : this.state.getAllKeys('service');
  await Promise.each(serviceNames, async (currentServiceName) => {
    const service = this.service.getService(currentServiceName);
    if (!service || !service.message || typeof service.message.sendToUser !== 'function') {
      if (serviceName) {
        logger.warn(`Message service "${serviceName}" not found or not a messaging channel, message not sent.`);
      }
      return;
    }
    try {
      if (serviceName) {
        // a targeted send is a deliberate user choice: trace it so a channel
        // silently no-oping (user not linked on that integration) can be
        // told apart from a channel never called at all
        logger.debug(`Forwarding message to user through the selected service "${currentServiceName}"`);
      }
      await service.message.sendToUser(user, message);
    } catch (e) {
      logger.warn(`Unable to forward message to user through ${currentServiceName}`);
      logger.warn(e);
    }
  });
}

module.exports = {
  forwardToChannels,
};
