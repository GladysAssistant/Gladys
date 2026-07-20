const db = require('../../models');
const logger = require('../../utils/logger');
const { CONTACT_VARIABLE } = require('./constants');

/**
 * @description List the contacts linked to this communication integration,
 * with the linked Gladys user (GET /contact of the host API).
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<Array>} Resolve with [{ contact_id, contact_name, linked_at, user }].
 * @example
 * const contacts = await gladys.externalIntegration.getLinkedContacts(service);
 */
async function getLinkedContacts(service) {
  const variables = await db.Variable.findAll({
    where: { name: CONTACT_VARIABLE, service_id: service.id },
    include: [{ model: db.User, as: 'user', attributes: ['selector', 'firstname', 'language'] }],
  });
  const contacts = [];
  variables.forEach((variable) => {
    let contact;
    try {
      contact = JSON.parse(variable.value);
    } catch (e) {
      logger.warn(`Invalid stored contact of integration ${service.selector}`, e);
      return;
    }
    contacts.push({
      contact_id: contact.contact_id,
      contact_name: contact.contact_name || null,
      linked_at: contact.linked_at || null,
      user: variable.user
        ? {
            selector: variable.user.selector,
            first_name: variable.user.firstname,
            language: variable.user.language,
          }
        : null,
    });
  });
  return contacts;
}

module.exports = {
  getLinkedContacts,
};
