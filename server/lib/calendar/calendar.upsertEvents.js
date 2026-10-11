const { Op } = require('sequelize');
const db = require('../../models');
const { buildUniqueSelector } = require('../../utils/addSelector');
const { slugify } = require('../../utils/slugify');
const { NotFoundError, ConflictError, BadParameters, ForbiddenError } = require('../../utils/coreErrors');

const MAX_EVENTS_PER_CALENDAR = 10000;

/**
 * @description Upsert a batch of events in a calendar, keyed by external_id, and
 * optionally prune: with a window, events of the calendar overlapping the window
 * (start < to, and end > from — the exclusive-end convention — or start >= from),
 * whose external_id starts with prunePrefix, and absent
 * from the pushed list are deleted. Events without the prefix (manually created
 * ones) are never pruned. A sync-disabled calendar is refused (403).
 * @param {string} calendarId - The calendar id.
 * @param {Array} events - Events to upsert ({ external_id, name, start, end, full_day, location, description,
 * url }); a missing end is stored as the start.
 * @param {object} [options] - Options.
 * @param {object} [options.window] - Replace window ({ from, to } dates).
 * @param {string} [options.prunePrefix] - The external_id prefix owning the prune (required with window).
 * @returns {Promise<object>} Resolve with { created, updated, deleted }.
 * @example
 * const { created, updated, deleted } = await gladys.calendar.upsertEvents(calendar.id, [
 *   { external_id: 'ext:my-integration:pepper:uid1', name: 'Dentist', start: '2026-08-14T09:00:00.000Z' },
 * ], {
 *   window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
 *   prunePrefix: 'ext:my-integration:pepper:',
 * });
 */
async function upsertEvents(calendarId, events, { window, prunePrefix } = {}) {
  return db.sequelize.transaction(async (transaction) => {
    const calendar = await db.Calendar.findOne({ where: { id: calendarId }, transaction });
    if (calendar === null) {
      throw new NotFoundError('Calendar not found');
    }
    // read in the transaction: a sync turned off while a push was being
    // validated must not see its emptied calendar refilled by that push
    if (calendar.sync === false) {
      throw new ForbiddenError('CALENDAR_SYNC_DISABLED');
    }
    let created = 0;
    let updated = 0;
    let deleted = 0;
    const movedFromCalendarIds = new Set();
    const taken = new Set();
    const pushedExternalIds = new Set(events.map((event) => event.external_id));
    if (window) {
      // without it, startsWith(undefined) tests against the string "undefined":
      // the prune would silently match nothing instead of failing
      if (typeof prunePrefix !== 'string' || prunePrefix.length === 0) {
        throw new BadParameters('prunePrefix: is required when a window is provided');
      }
      // Overlap semantics: start < to, and either end > from (the
      // exclusive-end convention: a full-day event ending exactly at `from`
      // does not overlap, and a multi-day event straddling `from` stays
      // prunable) or start >= from (an event without end, and a zero-duration
      // event starting exactly at `from`, which would otherwise fit no
      // window). The prefix filter runs in JS: a LIKE pattern would need
      // escaping for % and _ in external_ids. The prune runs before the
      // upsert (same final state, the pushed ids are never pruned): the
      // events cap then applies to the resulting calendar, so a window
      // republished at the cap is not refused for rows it replaces.
      const from = new Date(window.from);
      const candidates = await db.CalendarEvent.findAll({
        where: {
          calendar_id: calendarId,
          start: { [Op.lt]: new Date(window.to) },
          [Op.or]: [{ end: { [Op.gt]: from } }, { start: { [Op.gte]: from } }],
        },
        attributes: ['id', 'external_id'],
        transaction,
      });
      const toDelete = candidates
        .filter(
          (event) =>
            event.external_id !== null &&
            event.external_id.startsWith(prunePrefix) &&
            !pushedExternalIds.has(event.external_id),
        )
        .map((event) => event.id);
      if (toDelete.length > 0) {
        deleted = await db.CalendarEvent.destroy({ where: { id: toDelete }, transaction });
      }
    }
    const existingCount = await db.CalendarEvent.count({ where: { calendar_id: calendarId }, transaction });
    let count = existingCount;
    events.forEach((event) => {
      // the lookups below are keyed by external_id: a missing one would match
      // the manually created events (external_id NULL) and overwrite them
      if (typeof event.external_id !== 'string' || event.external_id.length === 0) {
        throw new BadParameters('external_id: must be a non-empty string');
      }
    });
    // One query per kind of row the batch reads, indexed in Maps, instead of
    // lookups per event inside the write transaction (which blocks every other
    // writer meanwhile): the loop below only inserts and updates. The event
    // selector derives from the external_id (the CalDAV precedent derives it
    // from the iCal UID): deriving it from the name would collide for every
    // occurrence of an expanded recurrence ("Weekly standup" × 52), and a name
    // in a non-Latin script slugifies to nothing. Two external_ids may still
    // slugify alike (uid-1, uid_1): a taken base falls back to the probing
    // buildUniqueSelector.
    const existingEvents = await db.CalendarEvent.findAll({
      where: { external_id: { [Op.in]: [...pushedExternalIds] } },
      transaction,
    });
    const existingByExternalId = new Map(existingEvents.map((row) => [row.external_id, row]));
    const sourceCalendars = await db.Calendar.findAll({
      where: {
        id: {
          [Op.in]: existingEvents.filter((row) => row.calendar_id !== calendarId).map((row) => row.calendar_id),
        },
      },
      attributes: ['id', 'user_id', 'service_id'],
      transaction,
    });
    const sourceCalendarById = new Map(sourceCalendars.map((row) => [row.id, row]));
    const selectorBase = (event) => slugify(event.external_id) || 'event';
    const selectorBases = events.filter((event) => !existingByExternalId.has(event.external_id)).map(selectorBase);
    const takenSelectorRows = await db.CalendarEvent.findAll({
      where: { selector: { [Op.in]: selectorBases } },
      attributes: ['selector'],
      transaction,
    });
    const takenInDb = new Set(takenSelectorRows.map((row) => row.selector));
    // eslint-disable-next-line no-restricted-syntax
    for (const event of events) {
      const existing = existingByExternalId.get(event.external_id);
      const fields = {
        name: event.name,
        start: event.start,
        // a timed event without end is a zero-duration event: the consumers
        // (the calendar scene trigger, is-event-running) read a non-null end
        end: event.end !== undefined && event.end !== null ? event.end : event.start,
        full_day: event.full_day !== undefined ? event.full_day : false,
        location: event.location !== undefined ? event.location : null,
        description: event.description !== undefined ? event.description : null,
        url: event.url !== undefined ? event.url : null,
      };
      if (existing) {
        if (existing.calendar_id !== calendarId) {
          // The event exists under another calendar: it is a move only within the
          // same owner (same user, same service) — the external_id column is
          // globally UNIQUE and a row of another owner is never stolen.
          const existingCalendar = sourceCalendarById.get(existing.calendar_id);
          if (
            existingCalendar === undefined ||
            existingCalendar.user_id !== calendar.user_id ||
            existingCalendar.service_id !== calendar.service_id
          ) {
            throw new ConflictError(`Event external_id "${event.external_id}" already belongs to another owner`);
          }
          fields.calendar_id = calendarId;
          count += 1;
          // the hard cap holds on the move path too, not only on creations
          if (count > MAX_EVENTS_PER_CALENDAR) {
            throw new BadParameters(`A calendar cannot hold more than ${MAX_EVENTS_PER_CALENDAR} events`);
          }
          movedFromCalendarIds.add(existing.calendar_id);
        }
        // eslint-disable-next-line no-await-in-loop
        await existing.update(fields, { transaction });
        updated += 1;
      } else {
        count += 1;
        if (count > MAX_EVENTS_PER_CALENDAR) {
          throw new BadParameters(`A calendar cannot hold more than ${MAX_EVENTS_PER_CALENDAR} events`);
        }
        const base = selectorBase(event);
        let selector = base;
        if (takenInDb.has(base) || taken.has(base)) {
          // eslint-disable-next-line no-await-in-loop
          selector = await buildUniqueSelector(db.CalendarEvent, base, { transaction, taken });
        } else {
          taken.add(base);
        }
        // eslint-disable-next-line no-await-in-loop
        const createdEvent = await db.CalendarEvent.create(
          {
            ...fields,
            calendar_id: calendarId,
            external_id: event.external_id,
            selector,
          },
          { transaction },
        );
        // an id repeated in the batch updates the row just created
        existingByExternalId.set(event.external_id, createdEvent);
        created += 1;
      }
    }
    return { created, updated, deleted, movedFromCalendarIds: [...movedFromCalendarIds] };
  });
}

module.exports = {
  upsertEvents,
};
