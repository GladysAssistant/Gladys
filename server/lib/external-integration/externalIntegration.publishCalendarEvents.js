const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');
const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError } = require('../../utils/coreErrors');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');
const {
  MAX_CALENDAR_EVENTS_PER_REQUEST,
  MAX_CALENDAR_EVENT_NAME_LENGTH,
  MAX_CALENDAR_EVENT_LOCATION_LENGTH,
  MAX_CALENDAR_EVENT_DESCRIPTION_LENGTH,
  MAX_CALENDAR_EVENT_URL_LENGTH,
  MAX_CALENDAR_EXTERNAL_ID_LENGTH,
} = require('./constants');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const URL_REGEX = /^https?:\/\//;
const CALENDAR_DATE_REGEX = /^\d{4}-\d{2}-\d{2}/;
// the scene engine's default: full-day events must line up with the
// timezone the calendar triggers are evaluated in
const DEFAULT_TIMEZONE = 'Europe/Paris';

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
 * @description Parse the date of a full-day event: its calendar date as
 * written by the provider — "2026-08-15", or the date part of an ISO
 * datetime, whatever its offset — never an instant converted between
 * timezones.
 * @param {*} value - The raw value.
 * @param {string} path - The path of the field, for error messages.
 * @returns {string} The calendar date (YYYY-MM-DD).
 * @example
 * parseCalendarDate('2026-08-15', 'events[0].start');
 */
function parseCalendarDate(value, path) {
  parseDate(value, path);
  const calendarDate = value.slice(0, 10);
  // Date.parse rolls "2026-02-30" over to March 2: the round trip refuses it
  if (!CALENDAR_DATE_REGEX.test(value) || dayjs.utc(calendarDate).format('YYYY-MM-DD') !== calendarDate) {
    throw new BadParameters(`${path}: must be a calendar date (YYYY-MM-DD) on a full-day event`);
  }
  return calendarDate;
}

/**
 * @description Upsert a batch of events in one of the integration's
 * calendars, keyed by external_id (never trusted: whitelist of fields,
 * bounded strings, dates parsed and validated). A full-day event is stored,
 * like the CalDAV ones, at the midnights of its calendar dates in the timezone
 * of the instance, its end exclusive and one day after its start by default.
 * With a window, membership is by overlap — start < to, and end > from
 * (exclusive end, the iCalendar convention) or start >= from: the
 * integration's events overlapping the window and absent from the list are
 * pruned — manually created events never are — and every pushed event must
 * overlap the window. A sync-disabled calendar answers 403.
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
  // a calendar left behind by a push racing the owner's disable stays
  // unwritable: only the calendars of an enabled account take events
  if (calendar === null || (await this.getCalendarAccount(service, calendar.user_id)) === null) {
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
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || DEFAULT_TIMEZONE;
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
    if (fullDay !== undefined && typeof fullDay !== 'boolean') {
      throw new BadParameters(`events[${index}].full_day: must be a boolean`);
    }
    const hasEnd = event.end !== undefined && event.end !== null;
    let result;
    if (fullDay === true) {
      // interpreted by calendar date, end exclusive (the iCalendar DATE
      // convention), stored at the local midnights of the instance — what
      // the CalDAV service stores, the calendar view renders and the scene
      // engine evaluates. A missing end, or one on the start date, covers
      // the start day.
      const startDate = parseCalendarDate(event.start, `events[${index}].start`);
      let endDate = dayjs
        .utc(startDate)
        .add(1, 'day')
        .format('YYYY-MM-DD');
      if (hasEnd) {
        const pushedEndDate = parseCalendarDate(event.end, `events[${index}].end`);
        if (pushedEndDate < startDate) {
          throw new BadParameters(`events[${index}].end: must not be before start`);
        }
        endDate = pushedEndDate > startDate ? pushedEndDate : endDate;
      }
      result = {
        external_id: externalId,
        name,
        start: dayjs.tz(startDate, timezone).toDate(),
        end: dayjs.tz(endDate, timezone).toDate(),
        full_day: true,
      };
    } else {
      const start = parseDate(event.start, `events[${index}].start`);
      result = { external_id: externalId, name, start };
      if (hasEnd) {
        const end = parseDate(event.end, `events[${index}].end`);
        if (end < start) {
          throw new BadParameters(`events[${index}].end: must not be before start`);
        }
        result.end = end;
      }
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
      // at `from` belongs to the previous window), while an event starting
      // at `from` always belongs to it (a zero-duration one included)
      const overlaps =
        result.start < parsedWindow.to &&
        ((result.end !== undefined && result.end > parsedWindow.from) || result.start >= parsedWindow.from);
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
  // by the upsert), each one to its own audience — everyone for a shared
  // calendar, the owner only for a private one
  const touchedCalendars = [calendar];
  if (movedFromCalendarIds.length > 0) {
    const sourceCalendars = await db.Calendar.findAll({
      where: { id: movedFromCalendarIds },
      attributes: ['selector', 'shared'],
    });
    touchedCalendars.push(...sourceCalendars);
  }
  this.notifyCalendarsUpdated(calendar.user_id, touchedCalendars);
  return { success: true, created, updated, deleted };
}

module.exports = {
  publishCalendarEvents,
};
