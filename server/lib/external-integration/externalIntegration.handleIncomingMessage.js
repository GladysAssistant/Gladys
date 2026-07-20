const { v4: uuidv4 } = require('uuid');

const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { CONTACT_VARIABLE, MAX_MESSAGE_TEXT_LENGTH } = require('./constants');

/**
 * @description Handle a message published by a communication integration
 * (POST /message of the host API): resolve contact_id -> user through the
 * link table, then emit the standard EVENTS.MESSAGE.NEW with
 * source = the integration selector — brain, reply and history work
 * unchanged. An unknown contact is a 404: the integration can then answer
 * in the channel "account not linked, code required". An incoming message
 * carries the authority of the linked user: the link-by-code consent
 * (createLinkCode/linkContact) is what protects this path.
 * @param {object} service - The external integration service (plain object).
 * @param {object} body - The incoming message.
 * @param {string} body.contact_id - Id of the contact in the external channel.
 * @param {string} body.text - Text of the message.
 * @param {string} [body.created_at] - ISO date of the message.
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.handleIncomingMessage(service, { contact_id: '12345', text: 'Turn on the light' });
 */
async function handleIncomingMessage(service, { contact_id: contactId, text, created_at: createdAt } = {}) {
  if (typeof contactId !== 'string' || contactId.length === 0) {
    throw new BadParameters('contact_id: must be a non-empty string');
  }
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_MESSAGE_TEXT_LENGTH) {
    throw new BadParameters(`text: must be a string of 1-${MAX_MESSAGE_TEXT_LENGTH} characters`);
  }
  if (createdAt !== undefined && Number.isNaN(Date.parse(createdAt))) {
    throw new BadParameters('created_at: must be an ISO 8601 date');
  }
  // resolve contact_id -> user through the links of THIS integration
  const variables = await db.Variable.findAll({
    where: { name: CONTACT_VARIABLE, service_id: service.id },
  });
  const linkVariable = variables.find((variable) => {
    try {
      return JSON.parse(variable.value).contact_id === contactId;
    } catch (e) {
      logger.warn(`Invalid stored contact of integration ${service.selector}`, e);
      return false;
    }
  });
  if (!linkVariable) {
    throw new NotFoundError('CONTACT_NOT_FOUND');
  }
  const user = await db.User.findOne({ where: { id: linkVariable.user_id } });
  if (user === null) {
    throw new NotFoundError('CONTACT_NOT_FOUND');
  }
  const plainUser = user.get({ plain: true });
  delete plainUser.password;
  this.event.emit(EVENTS.MESSAGE.NEW, {
    source: service.selector,
    source_user_id: contactId,
    user_id: plainUser.id,
    user: plainUser,
    language: plainUser.language,
    created_at: createdAt || new Date().toISOString(),
    text,
    id: uuidv4(),
  });
  return { success: true };
}

module.exports = {
  handleIncomingMessage,
};
