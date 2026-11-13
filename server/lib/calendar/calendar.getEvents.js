const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Get calendar events.
 * @param {string} userId - The user id.
 * @param {object} options - Options of the query.
 * @returns {Promise<Array>} Return list of events.
 * @example
 * gladys.calendar.getEvents();
 */
async function getEvents(userId, options) {
  const where = {};

  if (options.from || options.to) {
    const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    // Default from date is one week ago
    const fromDate = options.from ? new Date(options.from) : new Date(oneWeekAgo);
    // default end date is now
    const toDate = options.to ? new Date(options.to) : new Date();
    // Every event overlapping the range, whatever its start date: the same
    // overlap as the window prune of the calendar external integrations
    // (calendar.upsertEvents.js, docs/specs/external-integrations/capabilities/calendar-type.md).
    // start < to, and either end > from (exclusive end: a multi-day event
    // straddling `from` is returned, an event ending exactly at `from` is not)
    // or start >= from (an event without end, and a zero-duration event
    // starting exactly at `from`). An event without end stays bounded by
    // `from`: past point-in-time events never pile up in every later range.
    where.start = {
      [Op.lt]: toDate,
    };
    where[Op.or] = [{ end: { [Op.gt]: fromDate } }, { start: { [Op.gte]: fromDate } }];
  }

  if (options.selector) {
    where.selector = {
      [Op.eq]: options.selector,
    };
  }

  if (options.url) {
    where.url = {
      [Op.eq]: options.url,
    };
  }

  if (options.externalId) {
    where.external_id = {
      [Op.eq]: options.externalId,
    };
  }

  if (options.calendarId) {
    where.calendar_id = {
      [Op.eq]: options.calendarId,
    };
  }

  const calendarEvents = await db.CalendarEvent.findAll({
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        attributes: ['name', 'selector'],
        where: {
          [Op.or]: [
            {
              user_id: userId,
            },
            ...(options.shared
              ? [
                  {
                    shared: true,
                  },
                ]
              : []),
          ],
        },
      },
    ],
    where,
  });

  const plainCalendarEvents = calendarEvents.map((calendarEvent) => calendarEvent.get({ plain: true }));

  return plainCalendarEvents;
}

module.exports = {
  getEvents,
};
