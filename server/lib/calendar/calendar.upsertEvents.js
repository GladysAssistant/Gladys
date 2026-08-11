const { Op } = require('sequelize');
const db = require('../../models');
const { buildUniqueSelector } = require('../../utils/addSelector');
const { NotFoundError, ConflictError, BadParameters } = require('../../utils/coreErrors');

const MAX_EVENTS_PER_CALENDAR = 10000;

/**
 * @description Upsert a batch of events in a calendar, keyed by external_id, and
 * optionally prune: with a window, events of the calendar overlapping the window
 * (start < to and (end ?? start) >= from), whose external_id starts with
 * prunePrefix, and absent from the pushed list are deleted. Events without the
 * prefix (manually created ones) are never pruned.
 * @param {string} calendarId - The calendar id.
 * @param {Array} events - Events to upsert ({ external_id, name, start, end, full_day, location, description, url }).
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
    let created = 0;
    let updated = 0;
    let deleted = 0;
    const taken = new Set();
    const pushedExternalIds = new Set(events.map((event) => event.external_id));
    const existingCount = await db.CalendarEvent.count({ where: { calendar_id: calendarId }, transaction });
    let count = existingCount;
    // eslint-disable-next-line no-restricted-syntax
    for (const event of events) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.CalendarEvent.findOne({
        where: { external_id: event.external_id },
        transaction,
      });
      const fields = {
        name: event.name,
        start: event.start,
        end: event.end !== undefined ? event.end : null,
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
          // eslint-disable-next-line no-await-in-loop
          const existingCalendar = await db.Calendar.findOne({
            where: { id: existing.calendar_id },
            transaction,
          });
          if (
            existingCalendar === null ||
            existingCalendar.user_id !== calendar.user_id ||
            existingCalendar.service_id !== calendar.service_id
          ) {
            throw new ConflictError(`Event external_id "${event.external_id}" already belongs to another owner`);
          }
          fields.calendar_id = calendarId;
          count += 1;
        }
        // eslint-disable-next-line no-await-in-loop
        await existing.update(fields, { transaction });
        updated += 1;
      } else {
        count += 1;
        if (count > MAX_EVENTS_PER_CALENDAR) {
          throw new BadParameters(`A calendar cannot hold more than ${MAX_EVENTS_PER_CALENDAR} events`);
        }
        // eslint-disable-next-line no-await-in-loop
        const selector = await buildUniqueSelector(db.CalendarEvent, event.name, { transaction, taken });
        // eslint-disable-next-line no-await-in-loop
        await db.CalendarEvent.create(
          {
            ...fields,
            calendar_id: calendarId,
            external_id: event.external_id,
            selector,
          },
          { transaction },
        );
        created += 1;
      }
    }
    if (window) {
      // Overlap semantics: start < to and (end ?? start) >= from — a multi-day
      // event straddling `from` stays prunable. The prefix filter runs in JS:
      // a LIKE pattern would need escaping for % and _ in external_ids.
      const candidates = await db.CalendarEvent.findAll({
        where: {
          calendar_id: calendarId,
          start: { [Op.lt]: new Date(window.to) },
          [Op.or]: [
            { end: { [Op.gte]: new Date(window.from) } },
            { end: null, start: { [Op.gte]: new Date(window.from) } },
          ],
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
    return { created, updated, deleted };
  });
}

module.exports = {
  upsertEvents,
};
