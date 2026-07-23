const Promise = require('bluebird');

const logger = require('../../utils/logger');

/**
 * @description Forward a message to every outbound channel of a user: every
 * service in the stateManager exposing `message.sendToUser(user, message)`
 * is called; each service resolves its own identity for the user and no-ops
 * when the user is not linked. The core does not know any channel by name —
 * telegram, nextcloud-talk, callmebot and external "communication"
 * integrations all go through this same interface. A failing channel never
 * prevents the others.
 * @param {object} user - The Gladys user.
 * @param {object} message - The message to forward.
 * @returns {Promise} Resolve when every channel was tried.
 * @example
 * await this.forwardToChannels(user, messageCreated);
 */
async function forwardToChannels(user, message) {
  const serviceNames = this.state.getAllKeys('service');
  await Promise.each(serviceNames, async (serviceName) => {
    const service = this.service.getService(serviceName);
    if (!service || !service.message || typeof service.message.sendToUser !== 'function') {
      return;
    }
    try {
      await service.message.sendToUser(user, message);
    } catch (e) {
      logger.warn(`Unable to forward message to user through ${serviceName}`);
      logger.warn(e);
    }
  });
}

module.exports = {
  forwardToChannels,
};
