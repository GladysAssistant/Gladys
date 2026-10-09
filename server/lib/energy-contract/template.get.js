const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { ENERGY_CONTRACT_PROVIDER_KINDS, SERVICE_TYPES, SERVICE_STATUS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description The summary of a template for the list (no tariff).
 * @param {object} template - Full template.
 * @returns {object} Summary.
 * @example
 * summarize(template);
 */
function summarize(template) {
  const { tariff, ...summary } = template;
  return summary;
}

/**
 * @description Templates declared by the installed external integrations (manifest
 * `energy_contracts.templates`), offered even when the integration is stopped, with a notice.
 * @returns {Promise<Array<object>>} Templates tagged with their provider.
 * @example
 * await this.getIntegrationTemplates();
 */
async function getIntegrationTemplates() {
  const services = await db.Service.findAll({
    where: { type: SERVICE_TYPES.EXTERNAL },
    attributes: ['id', 'name', 'selector', 'status', 'manifest'],
  });
  const templates = [];
  services.forEach((service) => {
    const declared =
      service.manifest && service.manifest.energy_contracts && service.manifest.energy_contracts.templates;
    if (!Array.isArray(declared)) {
      return;
    }
    declared.forEach((template) => {
      templates.push({
        ...template,
        provider: {
          kind: ENERGY_CONTRACT_PROVIDER_KINDS.INTEGRATION,
          service_id: service.id,
          name: service.manifest.name || service.name,
          selector: service.selector,
          status: service.status,
          running: service.status === SERVICE_STATUS.RUNNING,
        },
      });
    });
  });
  return templates;
}

/**
 * @description Templates provided by the internal services exposing an `energyContracts`
 * interface (edf-tempo), duck-typed like the weather providers.
 * @returns {Array<object>} Templates tagged with their provider.
 * @example
 * this.getInternalTemplates();
 */
function getInternalTemplates() {
  const templates = [];
  this.stateManager.getAllKeys('service').forEach((serviceName) => {
    const service = this.serviceManager.getService(serviceName);
    const declared = service && service.energyContracts && service.energyContracts.templates;
    if (!Array.isArray(declared)) {
      return;
    }
    declared.forEach((template) => {
      templates.push({
        ...template,
        provider: {
          kind: ENERGY_CONTRACT_PROVIDER_KINDS.INTERNAL,
          service_id: null,
          name: serviceName,
          selector: serviceName,
          running: true,
        },
      });
    });
  });
  return templates;
}

/**
 * @description All the available templates, merged from the community catalogue, the
 * installed integrations and the internal services (section 8.1, `GET /energy_contract/template`).
 * The catalogue being unreachable is not an error: the other sources are returned.
 * @returns {Promise<Array<object>>} Template summaries.
 * @example
 * await getTemplates();
 */
async function getTemplates() {
  let community = [];
  try {
    community = await this.getCommunityTemplates();
  } catch (e) {
    logger.warn(`Energy contracts catalogue unavailable: ${e.message}`);
  }
  const integration = await this.getIntegrationTemplates();
  const internal = this.getInternalTemplates();
  return [...internal, ...integration, ...community].map(summarize);
}

/**
 * @description The full template (with its tariff) of a provider, to instantiate it.
 * @param {string} providerKind - `community`, `integration` or `internal`.
 * @param {string} key - Template key.
 * @param {object} [options] - `variant` (v1 catalogue: the subscribed power), `service_id`.
 * @returns {Promise<object>} The template.
 * @example
 * await getTemplate('community', 'edf-base', { variant: '6' });
 */
async function getTemplate(providerKind, key, options = {}) {
  let templates;
  if (providerKind === ENERGY_CONTRACT_PROVIDER_KINDS.COMMUNITY) {
    templates = await this.getCommunityTemplates();
  } else if (providerKind === ENERGY_CONTRACT_PROVIDER_KINDS.INTEGRATION) {
    templates = await this.getIntegrationTemplates();
  } else {
    templates = this.getInternalTemplates();
  }
  const template = templates.find(
    (t) =>
      t.key === key &&
      (options.variant === undefined || t.variant === undefined || String(t.variant) === String(options.variant)) &&
      (options.service_id === undefined || t.provider.service_id === options.service_id),
  );
  if (!template) {
    throw new NotFoundError(`ENERGY_CONTRACT_TEMPLATE_NOT_FOUND`);
  }
  return template;
}

module.exports = { getTemplates, getTemplate, getIntegrationTemplates, getInternalTemplates, summarize };
