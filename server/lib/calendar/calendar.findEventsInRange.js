const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const db = require('../../models');

dayjs.extend(utc);
dayjs.extend(timezone);

const HALF_A_DAY_IN_MS = 12 * 60 * 60 * 1000;

/**
 * @description Get the calendar date a full-day event starts on. Full-day events cover calendar
 * dates but are stored as instants: at midnight UTC (CalDAV sync on a server running in UTC,
 * events created through the API) or at the midnight of a local timezone (CalDAV sync on a
 * server running with a TZ, external calendar integrations). Like the calendar view, the date
 * is the UTC date of a midnight UTC, else the date of the nearest midnight in the given timezone.
 * @param {Date} start - Stored start of the full-day event.
 * @param {string} tz - Timezone of the house.
 * @returns {string} The date, formatted as YYYY-MM-DD.
 * @example
 * getFullDayDate(new Date('2025-03-10T23:00:00.000Z'), 'Europe/Paris'); // '2025-03-11'
 */
function getFullDayDate(start, tz) {
  const startUtc = dayjs.utc(start);
  if (startUtc.valueOf() === startUtc.startOf('day').valueOf()) {
    return startUtc.format('YYYY-MM-DD');
  }
  const startLocal = startUtc.tz(tz);
  const localDate = startLocal.format('YYYY-MM-DD');
  const msSinceLocalMidnight =
    ((startLocal.hour() * 60 + startLocal.minute()) * 60 + startLocal.second()) * 1000 + startLocal.millisecond();
  if (msSinceLocalMidnight > HALF_A_DAY_IN_MS) {
    return dayjs
      .utc(localDate)
      .add(1, 'day')
      .format('YYYY-MM-DD');
  }
  return localDate;
}

/**
 * @description Find events starting in a given time range, in shared calendars.
 * @param {Array} calendars - Array of calendar selectors.
 * @param {Date} from - Start of the time range.
 * @param {Date} to - End of the time range.
 * @param {object} [fullDayRange] - Calendar days to match full-day events on, instead of the time range.
 * @param {string} fullDayRange.from - First day of the range, formatted as YYYY-MM-DD.
 * @param {string} fullDayRange.to - Last day of the range, formatted as YYYY-MM-DD.
 * @param {string} fullDayRange.timezone - Timezone of the house.
 * @returns {Promise<Array>} Resolve with an array of events sorted by start date.
 * @example
 * gladys.calendar.findEventsInRange(calendars, from, to);
 */
async function findEventsInRange(calendars, from, to, fullDayRange) {
  // Full-day events are stored at a midnight which is not always the one of the house
  // timezone, so a caller working on calendar days can ask to match them on their date
  // instead of the local bounds. The candidates are fetched from the UTC day before the
  // range to the end of its last UTC day, where the midnights of the days of the range
  // fall in every timezone (UTC+14 to UTC-12), then filtered on their date.
  const startCondition = fullDayRange
    ? {
        [Op.or]: [
          {
            full_day: false,
            start: {
              [Op.gte]: from,
              [Op.lte]: to,
            },
          },
          {
            full_day: true,
            start: {
              [Op.gte]: dayjs
                .utc(fullDayRange.from)
                .subtract(1, 'day')
                .toDate(),
              [Op.lt]: dayjs
                .utc(fullDayRange.to)
                .add(1, 'day')
                .toDate(),
            },
          },
        ],
      }
    : {
        start: {
          [Op.gte]: from,
          [Op.lte]: to,
        },
      };
  const queryParams = {
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['firstname', 'language'],
          },
        ],
      },
    ],
    where: {
      ...startCondition,
      '$calendar.selector$': {
        [Op.in]: calendars,
      },
      '$calendar.shared$': true,
    },
    order: [['start', 'ASC']],
  };
  const eventsMatching = await db.CalendarEvent.findAll(queryParams);

  return eventsMatching
    .map((event) => event.get({ plain: true }))
    .filter((event) => {
      if (!fullDayRange || !event.full_day) {
        return true;
      }
      const date = getFullDayDate(event.start, fullDayRange.timezone);
      return date >= fullDayRange.from && date <= fullDayRange.to;
    });
}

module.exports = {
  findEventsInRange,
  getFullDayDate,
};
