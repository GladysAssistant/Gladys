const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Get calendar events
 * @param {string} userId - The user id.
 * @param {Object} options - Options of the query.
 * @example
 * gladys.calendar.getEvents();
 */
async function getEvents(userId, options) {
  const queryParams = {
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        attributes: ['name', 'selector'],
        where: {
          user_id: userId,
        },
      },
    ],
    where: {},
    order: [[ 'start', 'ASC' ]]
  };

  if (options.from && options.to) {
    queryParams.where.start = {
      [Op.between]:[new Date(options.from), new Date(options.to)],
    };
  } else if (options.from && options.to === undefined) {
    queryParams.where.start = {
      [Op.gte]: new Date(options.from),
    };
  } else if (options.to && options.from === undefined) {
    queryParams.where.start = {
      [Op.lte]: new Date(options.to),
    };
  }

  if (options.selector) {
    queryParams.where.selector = {
      [Op.eq]: options.selector,
    };
  }

  if (options.name) {
    queryParams.where.name = {
      [Op.eq]: options.name,
    };
  }

  if (options.url) {
    queryParams.where.url = {
      [Op.eq]: options.url,
    };
  }

  if (options.externalId) {
    queryParams.where.external_id = {
      [Op.eq]: options.externalId,
    };
  }

  if (options.calendarId) {
    queryParams.where.calendar_id = {
      [Op.eq]: options.calendarId,
    };
  }

  if (options.order_by) {
    queryParams.order.push([ options.order_by, options.order_dir || 'ASC' ]);
  }

  if (options.take) {
    queryParams.limit = options.take;
  }

  const calendarEvents = await db.CalendarEvent.findAll(queryParams);

  const plainCalendarEvents = calendarEvents.map((calendarEvent) => calendarEvent.get({ plain: true }));

  return plainCalendarEvents;
}

/**
 * @description Get calendar events on-going at a given date.
 * @param {string} userId - The user id.
 * @param {Object} date - Date of on-going events.
 * @param {Object} options - Options of the query.
 * @example
 * gladys.calendar.getEventsForDate();
 */
async function getEventsForDate(userId, date, options) {
  const where = {
    start: {
      [Op.lte]: new Date(date),
    },
    end: {
      [Op.gte]: new Date(date),
    },
  };

  const order = [
    ['start', 'ASC']
  ];

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
          user_id: userId,
        },
      },
    ],
    where,
    order,
  });

  const plainCalendarEvents = calendarEvents.map((calendarEvent) => calendarEvent.get({ plain: true }));

  return plainCalendarEvents;
}

module.exports = {
  getEvents,
  getEventsForDate,
};
