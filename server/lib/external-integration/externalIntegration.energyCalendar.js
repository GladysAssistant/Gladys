const { ForbiddenError, BadParameters } = require('../../utils/coreErrors');
const { ENERGY_CALENDAR_REFRESH_MIN_INTERVAL_MS, ENERGY_CALENDAR_REFRESH_LOOKBACK_MS } = require('./constants');
const logger = require('../../utils/logger');

/**
 * @description The calendars an integration declares in its manifest.
 * @param {object} service - The service row.
 * @returns {Array<object>} The declarations (empty without the capability).
 * @example
 * getDeclaredEnergyCalendars(service);
 */
function getDeclaredEnergyCalendars(service) {
  const field = service && service.manifest && service.manifest.energy_contracts;
  return field && Array.isArray(field.calendars) ? field.calendars : [];
}

/**
 * @description Declare the calendars of an integration's manifest in the core (install,
 * update, boot): the first integration declaring a key owns it, an already-owned key is
 * refused with a warning (capabilities/energy-contracts.md, section 1).
 * @param {object} service - The service row (with its manifest).
 * @returns {Promise<Array<string>>} The warnings (refused declarations).
 * @example
 * const warnings = await gladys.externalIntegration.declareEnergyCalendars(service);
 */
async function declareEnergyCalendars(service) {
  const warnings = [];
  const declared = getDeclaredEnergyCalendars(service);
  // eslint-disable-next-line no-restricted-syntax
  for (const definition of declared) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.energyContract.declareCalendar(definition, service.id);
      if (!result.accepted) {
        warnings.push(result.reason);
      }
    } catch (e) {
      warnings.push(`calendar "${definition.key}": ${e.message}`);
    }
  }
  if (warnings.length > 0) {
    logger.warn(`Integration ${service.selector}: ${warnings.join(' ; ')}`);
  }
  return warnings;
}

/**
 * @description Host API `POST /api/integration/v1/energy/calendar`: publish entries in a
 * calendar the integration declares (403 otherwise).
 * @param {object} service - The calling integration.
 * @param {object} body - { calendar_key, entries }.
 * @returns {Promise<object>} { count, changed_from }.
 * @example
 * await gladys.externalIntegration.publishEnergyCalendar(service, { calendar_key: 'tempo', entries });
 */
async function publishEnergyCalendar(service, body) {
  if (body === null || typeof body !== 'object' || typeof body.calendar_key !== 'string') {
    throw new BadParameters('calendar_key: must be a string');
  }
  const declared = getDeclaredEnergyCalendars(service).some((c) => c && c.key === body.calendar_key);
  if (!declared) {
    throw new ForbiddenError(`calendar "${body.calendar_key}" is not declared by this integration`);
  }
  return this.energyContract.publishCalendarEntries(body.calendar_key, body.entries, {
    provider_service_id: service.id,
  });
}

/**
 * @description Host API `GET /api/integration/v1/energy/calendar/:key`: read back a calendar
 * the integration declares (resume after a restart).
 * @param {object} service - The calling integration.
 * @param {string} key - Calendar key.
 * @param {object} [options] - `from`, `to`, `limit`.
 * @returns {Promise<Array<object>>} The entries.
 * @example
 * await gladys.externalIntegration.getEnergyCalendar(service, 'tempo', { from: '2026-01-01' });
 */
async function getEnergyCalendar(service, key, options = {}) {
  const declared = getDeclaredEnergyCalendars(service).some((c) => c && c.key === key);
  if (!declared) {
    throw new ForbiddenError(`calendar "${key}" is not declared by this integration`);
  }
  return this.energyContract.getCalendarEntries(key, options);
}

/**
 * @description Host API `GET /api/integration/v1/energy/contract`: the users' contracts
 * referencing a template of this integration, without the meter nor the consumption.
 * @param {object} service - The calling integration.
 * @returns {Promise<Array<object>>} The contracts.
 * @example
 * await gladys.externalIntegration.getEnergyContracts(service);
 */
async function getEnergyContracts(service) {
  const contracts = await this.energyContract.get({ provider_service_id: service.id });
  return contracts.map((contract) => ({
    id: contract.id,
    template_key: contract.template_key,
    template_version: contract.template_version,
    pricing_mode: contract.pricing_mode,
    inputs: contract.inputs || {},
    valid_from: contract.valid_from,
    valid_to: contract.valid_to,
    timezone: contract.timezone,
    currency: contract.currency,
    billing_period_start_day: contract.billing_period_start_day,
    status: contract.status,
  }));
}

/**
 * @description `energy-calendar.refresh` nudge (WebSocket, integration → core): the core
 * recomputes the recent costs of the meters reading the calendars this integration owns,
 * at most once per minute per integration; ignored from an integration without the capability.
 * @param {object} service - The calling integration.
 * @returns {Promise<void>} Resolves when queued.
 * @example
 * await gladys.externalIntegration.handleEnergyCalendarRefresh(service);
 */
async function handleEnergyCalendarRefresh(service) {
  const declared = getDeclaredEnergyCalendars(service);
  if (declared.length === 0) {
    logger.debug(`energy-calendar.refresh nudge from ${service.selector} without calendars: ignored`);
    return;
  }
  const now = Date.now();
  const lastNudge = this.energyCalendarRefreshTimes.get(service.id);
  if (lastNudge !== undefined && now - lastNudge < ENERGY_CALENDAR_REFRESH_MIN_INTERVAL_MS) {
    logger.debug(`energy-calendar.refresh nudge from ${service.selector} rate-limited: ignored`);
    return;
  }
  this.energyCalendarRefreshTimes.set(service.id, now);
  const from = new Date(now - ENERGY_CALENDAR_REFRESH_LOOKBACK_MS);
  // eslint-disable-next-line no-restricted-syntax
  for (const definition of declared) {
    // eslint-disable-next-line no-await-in-loop
    await this.energyContract.requestCalendarRecalculation(definition.key, from);
  }
}

module.exports = {
  getDeclaredEnergyCalendars,
  declareEnergyCalendars,
  publishEnergyCalendar,
  getEnergyCalendar,
  getEnergyContracts,
  handleEnergyCalendarRefresh,
};
