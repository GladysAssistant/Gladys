const logger = require('../../utils/logger');
const { CONTACT_PROFILE_VARIABLE } = require('./constants');

/**
 * @description True when the communication integration can receive messages
 * (chat channel: inbound + outbound, code-based link, user authority). The
 * default: a communication manifest without `messaging` is a chat channel.
 * False for send-only notification channels (messaging.receive false — the
 * Free Mobile family) and for non-communication integrations.
 * @param {object} manifest - The integration manifest.
 * @returns {boolean} True for a receiving communication channel.
 * @example
 * const receiving = isReceivingChannel(service.manifest);
 */
function isReceivingChannel(manifest) {
  if (!manifest || manifest.type !== 'communication') {
    return false;
  }
  return !(manifest.messaging && manifest.messaging.receive === false);
}

/**
 * @description True for a send-only notification channel (communication
 * with messaging.receive false): POST /message and the code-based link
 * answer 403 — the "never the authority of the user" guarantee is enforced
 * server-side, not only by the manifest.
 * @param {object} manifest - The integration manifest.
 * @returns {boolean} True for a send-only communication channel.
 * @example
 * const sendOnly = isSendOnlyChannel(service.manifest);
 */
function isSendOnlyChannel(manifest) {
  return Boolean(manifest) && manifest.type === 'communication' && !isReceivingChannel(manifest);
}

/**
 * @description The per-user identity form of a send-only channel (flat
 * config_schema format), or an empty list.
 * @param {object} manifest - The integration manifest.
 * @returns {Array} The contact schema fields.
 * @example
 * const schema = getContactSchema(service.manifest);
 */
function getContactSchema(manifest) {
  return (manifest && manifest.contact_schema) || [];
}

/**
 * @description The contact_schema values of one user on a send-only
 * communication integration (secrets included: this feeds the outbound
 * message relay, not the frontend), or null when the user has not
 * configured their account.
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user.
 * @returns {Promise<object|null>} Resolve with the values object or null.
 * @example
 * const profile = await gladys.externalIntegration.getContactProfile(service, user.id);
 */
async function getContactProfile(service, userId) {
  const raw = await this.variable.getValue(CONTACT_PROFILE_VARIABLE, service.id, userId);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    logger.warn(`Invalid stored contact profile of integration ${service.selector}`, e);
    return null;
  }
}

module.exports = {
  getContactProfile,
  isReceivingChannel,
  isSendOnlyChannel,
  getContactSchema,
};
