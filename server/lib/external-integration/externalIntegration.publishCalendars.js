const { Op } = require('sequelize');
const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');
const {
  MAX_CALENDARS_PER_USER,
  MAX_CALENDAR_NAME_LENGTH,
  MAX_CALENDAR_DESCRIPTION_LENGTH,
  CALENDAR_COLOR_REGEX,
  MAX_CALENDAR_EXTERNAL_ID_LENGTH,
} = require('./constants');

/**
 * @description Upsert a batch of calendars for one enabled user, keyed by
 * external_id (never trusted: whitelist of fields, bounded strings, invalid
 * color dropped). The external_ids must carry the user-scoped prefix
 * ext:<selector>:<user_selector>: — the globally UNIQUE columns make
 * cross-user collisions impossible by construction.
 * @param {object} service - The external integration service (plain object).
 * @param {object} body - The payload ({ user, calendars }).
 * @returns {Promise<object>} Resolve with { success, created, updated }.
 * @example
 * await gladys.externalIntegration.publishCalendars(service, {
 *   user: 'john',
 *   calendars: [{ external_id: 'ext:my-int:john:primary', name: 'Personal' }],
 * });
 */
async function publishCalendars(service, body = {}) {
  if (!isCalendarIntegration(service.manifest)) {
    throw new ForbiddenError('CALENDAR_NOT_ALLOWED');
  }
  this.assertCalendarWriteAllowed(service);
  const { user: userSelector, calendars } = body;
  if (typeof userSelector !== 'string' || userSelector.length === 0) {
    throw new BadParameters('user: must be a non-empty string');
  }
  if (!Array.isArray(calendars)) {
    throw new BadParameters('calendars: must be an array');
  }
  const user = await db.User.findOne({ where: { selector: userSelector }, attributes: ['id', 'selector'] });
  if (user === null || (await this.getCalendarAccount(service, user.id)) === null) {
    // an unknown user and a user who did not enable the integration answer
    // the same: the integration only syncs enabled accounts
    throw new NotFoundError('CALENDAR_ACCOUNT_NOT_FOUND');
  }
  const prefix = `ext:${service.selector}:${user.selector}:`;
  const seenExternalIds = new Set();
  const normalized = calendars.map((calendar, index) => {
    if (calendar === null || typeof calendar !== 'object' || Array.isArray(calendar)) {
      throw new BadParameters(`calendars[${index}]: must be an object`);
    }
    const { external_id: externalId, name, description, color } = calendar;
    if (
      typeof externalId !== 'string' ||
      !externalId.startsWith(prefix) ||
      externalId.length <= prefix.length ||
      externalId.length > MAX_CALENDAR_EXTERNAL_ID_LENGTH
    ) {
      throw new BadParameters(
        `calendars[${index}].external_id: must start with "${prefix}" (max ${MAX_CALENDAR_EXTERNAL_ID_LENGTH} chars)`,
      );
    }
    if (seenExternalIds.has(externalId)) {
      throw new BadParameters(`calendars[${index}].external_id: duplicate in the batch`);
    }
    seenExternalIds.add(externalId);
    if (typeof name !== 'string' || name.length === 0 || name.length > MAX_CALENDAR_NAME_LENGTH) {
      throw new BadParameters(`calendars[${index}].name: must be a string of 1-${MAX_CALENDAR_NAME_LENGTH} characters`);
    }
    const result = { external_id: externalId, name };
    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > MAX_CALENDAR_DESCRIPTION_LENGTH) {
        throw new BadParameters(
          `calendars[${index}].description: must be a string of at most ${MAX_CALENDAR_DESCRIPTION_LENGTH} characters`,
        );
      }
      result.description = description;
    }
    // optional metadata never rejects a calendar: an invalid color is dropped
    if (typeof color === 'string' && CALENDAR_COLOR_REGEX.test(color.toLowerCase())) {
      result.color = color.toLowerCase();
    }
    return result;
  });
  // hard cap per user: existing calendars outside this batch + the batch
  const existingOthers = await db.Calendar.count({
    where: {
      service_id: service.id,
      user_id: user.id,
      external_id: { [Op.notIn]: [...seenExternalIds] },
    },
  });
  if (existingOthers + normalized.length > MAX_CALENDARS_PER_USER) {
    throw new BadParameters(`calendars: a user cannot hold more than ${MAX_CALENDARS_PER_USER} calendars`);
  }
  const { created, updated, calendars: upserted } = await this.calendar.upsertCalendars(
    user.id,
    service.id,
    normalized,
  );
  this.notifyCalendarUpdated(
    user.id,
    upserted.map((calendar) => calendar.selector),
    upserted.some((calendar) => calendar.shared),
  );
  return { success: true, created, updated };
}

module.exports = {
  publishCalendars,
};
