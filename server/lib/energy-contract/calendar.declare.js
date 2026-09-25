const Joi = require('joi');
const db = require('../../models');
const { BadParameters, ConflictError } = require('../../utils/coreErrors');
const { TARIFF_CALENDAR_GRANULARITIES, TARIFF_CALENDAR_GRANULARITIES_LIST } = require('../../utils/constants');
const { CALENDAR_KEY_REGEX, TIME_START_REGEX } = require('./tariff.constants');
const { isValidTimezone } = require('./contract.validate');
const logger = require('../../utils/logger');

const MAX_CALENDAR_VALUES = 32;

const calendarSchema = Joi.object({
  key: Joi.string()
    .pattern(CALENDAR_KEY_REGEX)
    .required(),
  granularity: Joi.string()
    .valid(...TARIFF_CALENDAR_GRANULARITIES_LIST)
    .default(TARIFF_CALENDAR_GRANULARITIES.DAY),
  timezone: Joi.string().max(64),
  day_starts_at: Joi.string()
    .pattern(TIME_START_REGEX)
    .default('00:00'),
  values: Joi.array()
    .items(Joi.string().max(64))
    .unique()
    .min(1)
    .max(MAX_CALENDAR_VALUES),
  currency: Joi.string().pattern(/^[A-Z]{3}$/),
});

/**
 * @description Validate a calendar declaration (manifest `energy_contracts.calendars[]`
 * entry or internal declaration).
 * @param {object} definition - The declaration.
 * @param {string} defaultTimezone - Timezone when the declaration has none.
 * @returns {object} The normalized declaration.
 * @example
 * validateCalendarDefinition({ key: 'tempo', values: ['blue', 'white', 'red'] }, 'Europe/Paris');
 */
function validateCalendarDefinition(definition, defaultTimezone) {
  const { error, value } = calendarSchema.validate(definition, { abortEarly: true, convert: false });
  if (error) {
    const [detail] = error.details;
    throw new BadParameters(`calendar ${detail.path.join('.')}: ${detail.message.replace(/^"[^"]*" /, '')}`);
  }
  const timezone = value.timezone || defaultTimezone;
  if (!isValidTimezone(timezone)) {
    throw new BadParameters(`calendar timezone: "${timezone}" is not a known IANA timezone`);
  }
  return { ...value, timezone, values: value.values || null, currency: value.currency || null };
}

/**
 * @description Declare a calendar for a provider (capability file, section 1: keys are
 * global and owned). Creates the calendar, or claims an orphaned one with the same
 * granularity, or refreshes the metadata of a calendar this provider already owns.
 * A key owned by another provider is refused (the templates still read it).
 * @param {object} definition - Calendar declaration.
 * @param {string|null} providerServiceId - The declaring service id (null for a user/catalogue calendar).
 * @returns {Promise<object>} { calendar, accepted, reason } - accepted is false when another provider owns the key.
 * @example
 * await declareCalendar({ key: 'tempo', granularity: 'day', values: ['blue', 'white', 'red'] }, serviceId);
 */
async function declareCalendar(definition, providerServiceId = null) {
  const systemTimezone = (await this.variable.getValue('TIMEZONE')) || 'UTC';
  const value = validateCalendarDefinition(definition, systemTimezone);
  const existing = await db.TariffCalendar.findByPk(value.key);
  if (existing === null) {
    const row = await db.TariffCalendar.create({ ...value, provider_service_id: providerServiceId });
    logger.info(`Tariff calendar "${value.key}" declared (${value.granularity})`);
    return { calendar: row.get({ plain: true }), accepted: true };
  }
  const ownedByOther = existing.provider_service_id !== null && existing.provider_service_id !== providerServiceId;
  if (ownedByOther) {
    return {
      calendar: existing.get({ plain: true }),
      accepted: false,
      reason: `calendar "${value.key}" is already provided by another integration`,
    };
  }
  if (existing.granularity !== value.granularity) {
    throw new ConflictError(
      `calendar "${value.key}" is declared with granularity "${existing.granularity}", it cannot become "${value.granularity}"`,
    );
  }
  await existing.update({
    provider_service_id: providerServiceId,
    timezone: value.timezone,
    day_starts_at: value.day_starts_at,
    values: value.values,
    currency: value.currency,
  });
  return { calendar: existing.get({ plain: true }), accepted: true };
}

/**
 * @description Release every calendar owned by a provider (uninstall): the rows, their
 * metadata and their entries survive, the calendars are orphaned until claimed again.
 * @param {string} providerServiceId - The service id.
 * @returns {Promise<number>} Number of calendars released.
 * @example
 * await releaseCalendars(serviceId);
 */
async function releaseCalendars(providerServiceId) {
  const [count] = await db.TariffCalendar.update(
    { provider_service_id: null },
    { where: { provider_service_id: providerServiceId } },
  );
  if (count > 0) {
    logger.info(`${count} tariff calendar(s) orphaned after their provider left`);
  }
  return count;
}

module.exports = { declareCalendar, releaseCalendars, validateCalendarDefinition };
