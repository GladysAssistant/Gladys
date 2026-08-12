const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');
const {
  MAX_CALENDAR_EVENTS_PER_REQUEST,
  MAX_CALENDAR_EVENT_NAME_LENGTH,
  MAX_CALENDAR_EVENT_LOCATION_LENGTH,
  MAX_CALENDAR_EVENT_DESCRIPTION_LENGTH,
  MAX_CALENDAR_EVENT_URL_LENGTH,
  MAX_CALENDAR_EXTERNAL_ID_LENGTH,
} = require('./constants');

const URL_REGEX = /^https?:\/\//;

/**
 * @description Parse an ISO 8601 date field, throwing a 400 naming the entry.
 * @param {*} value - The raw value.
 * @param {string} path - The path of the field, for error messages.
 * @returns {Date} The parsed date.
 * @example
 * parseDate('2026-08-14T09:00:00.000Z', 'events[0].start');
 */
function parseDate(value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadParameters(`${path}: must be an ISO 8601 date`);
  }
  return new Date(value);
}

/**
 * @description Upsert a batch of events in one of the integration's
 * calendars, keyed by external_id (never trusted: whitelist of fields,
 * bounded strings, dates parsed and validated). With a window, membership is
 * by overlap — start < to, and end > from when end is set (exclusive end,
 * the iCalendar convention) else start >= from: the integration's
 * events overlapping the window and absent from the list are pruned —
 * manually created events never are — and every pushed event must overlap
 * the window. A sync-disabled calendar answers 403.
 * @param {object} service - The external integration service (plain object).
 * @param {object} body - The payload ({ calendar_external_id, events, window }).
 * @returns {Promise<object>} Resolve with { success, created, updated, deleted }.
 * @example
 * await gladys.externalIntegration.publishCalendarEvents(service, {
 *   calendar_external_id: 'ext:my-int:john:primary',
 *   events: [{ external_id: 'ext:my-int:john:uid1', name: 'Dentist', start: '2026-08-14T09:00:00.000Z' }],
 * });
 */
async function publishCalendarEvents(service, body = {}) {
  if (!isCalendarIntegration(service.manifest)) {
    throw new ForbiddenError('CALENDAR_NOT_ALLOWED');
  }
  this.assertCalendarWriteAllowed(service);
  const { calendar_external_id: calendarExternalId, events, window } = body;
  if (typeof calendarExternalId !== 'string' || calendarExternalId.length === 0) {
    throw new BadParameters('calendar_external_id: must be a non-empty string');
  }
  if (!Array.isArray(events)) {
    throw new BadParameters('events: must be an array');
  }
  if (events.length > MAX_CALENDAR_EVENTS_PER_REQUEST) {
    throw new BadParameters(`events: max ${MAX_CALENDAR_EVENTS_PER_REQUEST} events per request`);
  }
  const calendar = await db.Calendar.findOne({
    where: { external_id: calendarExternalId, service_id: service.id },
    include: [{ model: db.User, as: 'creator', attributes: ['selector'] }],
  });
  if (calendar === null) {
    throw new NotFoundError('CALENDAR_NOT_FOUND');
  }
  if (calendar.sync === false) {
    // the user said no: pushes to a sync-disabled calendar are refused so
    // the integration marks it skipped instead of silently writing
    throw new ForbiddenError('CALENDAR_SYNC_DISABLED');
  }
  let parsedWindow;
  if (window !== undefined) {
    if (window === null || typeof window !== 'object' || Array.isArray(window)) {
      throw new BadParameters('window: must be an object');
    }
    const from = parseDate(window.from, 'window.from');
    const to = parseDate(window.to, 'window.to');
    if (from >= to) {
      throw new BadParameters('window: from must be before to');
    }
    parsedWindow = { from, to };
  }
  const prefix = `ext:${service.selector}:${calendar.creator.selector}:`;
  const seenExternalIds = new Set();
  const normalized = events.map((event, index) => {
    if (event === null || typeof event !== 'object' || Array.isArray(event)) {
      throw new BadParameters(`events[${index}]: must be an object`);
    }
    const { external_id: externalId, name, full_day: fullDay, location, description, url } = event;
    if (
      typeof externalId !== 'string' ||
      !externalId.startsWith(prefix) ||
      externalId.length <= prefix.length ||
      externalId.length > MAX_CALENDAR_EXTERNAL_ID_LENGTH
    ) {
      throw new BadParameters(
        `events[${index}].external_id: must start with "${prefix}" (max ${MAX_CALENDAR_EXTERNAL_ID_LENGTH} chars)`,
      );
    }
    if (seenExternalIds.has(externalId)) {
      throw new BadParameters(`events[${index}].external_id: duplicate in the batch`);
    }
    seenExternalIds.add(externalId);
    if (typeof name !== 'string' || name.length === 0 || name.length > MAX_CALENDAR_EVENT_NAME_LENGTH) {
      throw new BadParameters(
        `events[${index}].name: must be a string of 1-${MAX_CALENDAR_EVENT_NAME_LENGTH} characters`,
      );
    }
    const start = parseDate(event.start, `events[${index}].start`);
    const result = { external_id: externalId, name, start };
    if (event.end !== undefined && event.end !== null) {
      const end = parseDate(event.end, `events[${index}].end`);
      if (end < start) {
        throw new BadParameters(`events[${index}].end: must not be before start`);
      }
      result.end = end;
    }
    if (fullDay !== undefined) {
      if (typeof fullDay !== 'boolean') {
        throw new BadParameters(`events[${index}].full_day: must be a boolean`);
      }
      result.full_day = fullDay;
    }
    if (location !== undefined && location !== null) {
      if (typeof location !== 'string' || location.length > MAX_CALENDAR_EVENT_LOCATION_LENGTH) {
        throw new BadParameters(
          `events[${index}].location: must be a string of at most ${MAX_CALENDAR_EVENT_LOCATION_LENGTH} characters`,
        );
      }
      result.location = location;
    }
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string' || description.length > MAX_CALENDAR_EVENT_DESCRIPTION_LENGTH) {
        throw new BadParameters(
          `events[${index}].description: must be a string of at most ${MAX_CALENDAR_EVENT_DESCRIPTION_LENGTH} characters`,
        );
      }
      result.description = description;
    }
    if (url !== undefined && url !== null) {
      if (typeof url !== 'string' || url.length > MAX_CALENDAR_EVENT_URL_LENGTH || !URL_REGEX.test(url)) {
        throw new BadParameters(
          `events[${index}].url: must be an http(s) URL of at most ${MAX_CALENDAR_EVENT_URL_LENGTH} characters`,
        );
      }
      result.url = url;
    }
    if (parsedWindow) {
      // replace semantics stay crisp: every pushed event must overlap the
      // window — exclusive on the end side (a full-day event ending exactly
      // at `from` belongs to the previous window)
      const overlaps =
        start < parsedWindow.to &&
        (result.end !== undefined ? result.end > parsedWindow.from : start >= parsedWindow.from);
      if (!overlaps) {
        throw new BadParameters(`events[${index}]: must overlap the window`);
      }
    }
    return result;
  });
  const { created, updated, deleted, movedFromCalendarIds } = await this.calendar.upsertEvents(
    calendar.id,
    normalized,
    {
      window: parsedWindow,
      prunePrefix: prefix,
    },
  );
  // an event move empties a row out of its source calendar: the push targets
  // the union of the source and destination calendars (same user, enforced
  // by the upsert), everyone when any of them is shared
  const selectors = [calendar.selector];
  let anyShared = calendar.shared;
  if (movedFromCalendarIds.length > 0) {
    const sourceCalendars = await db.Calendar.findAll({
      where: { id: movedFromCalendarIds },
      attributes: ['selector', 'shared'],
    });
    sourceCalendars.forEach((sourceCalendar) => {
      selectors.push(sourceCalendar.selector);
      anyShared = anyShared || sourceCalendar.shared;
    });
  }
  this.notifyCalendarUpdated(calendar.user_id, selectors, anyShared);
  return { success: true, created, updated, deleted };
}

module.exports = {
  publishCalendarEvents,
};
