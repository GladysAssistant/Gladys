const { Op } = require('sequelize');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { createCalendarLookup } = require('./calendar.lookup');
const logger = require('../../utils/logger');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES_READ = 20000;

/**
 * @description Turn a calendar row into its API shape (provider summary, coverage).
 * @param {object} row - Sequelize row with its provider_service include.
 * @returns {object} The calendar.
 * @example
 * toPlainCalendar(row);
 */
function toPlainCalendar(row) {
  const calendar = row.get({ plain: true });
  calendar.orphaned = calendar.provider_service_id === null;
  if (calendar.provider_service) {
    calendar.provider_service = {
      id: calendar.provider_service.id,
      name: calendar.provider_service.name,
      selector: calendar.provider_service.selector,
      status: calendar.provider_service.status,
      type: calendar.provider_service.type,
    };
  }
  return calendar;
}

/**
 * @description List the declared calendars with their provider and coverage (diagnostic UI).
 * @returns {Promise<Array<object>>} The calendars.
 * @example
 * await getCalendars();
 */
async function getCalendars() {
  const rows = await db.TariffCalendar.findAll({
    include: [{ model: db.Service, as: 'provider_service', attributes: ['id', 'name', 'selector', 'status', 'type'] }],
    order: [['key', 'ASC']],
  });
  return rows.map(toPlainCalendar);
}

/**
 * @description Get one calendar by key.
 * @param {string} key - Calendar key.
 * @returns {Promise<object>} The calendar.
 * @example
 * await getCalendar('tempo');
 */
async function getCalendar(key) {
  const row = await db.TariffCalendar.findByPk(key, {
    include: [{ model: db.Service, as: 'provider_service', attributes: ['id', 'name', 'selector', 'status', 'type'] }],
  });
  if (row === null) {
    throw new NotFoundError(`calendar "${key}" is not declared`);
  }
  return toPlainCalendar(row);
}

/**
 * @description Read the entries of a calendar over a window, oldest first.
 * @param {string} key - Calendar key.
 * @param {object} [options] - `from` / `to` (Date or ISO), `limit` (last N entries when no window).
 * @returns {Promise<Array<object>>} [{ starts_at, value }] where value is the string or the number.
 * @example
 * await getCalendarEntries('tempo', { from: '2026-01-01', to: '2026-02-01' });
 */
async function getCalendarEntries(key, options = {}) {
  await getCalendar(key);
  const where = { calendar_key: key };
  if (options.from !== undefined || options.to !== undefined) {
    where.starts_at = {};
    if (options.from !== undefined) {
      where.starts_at[Op.gte] = new Date(options.from);
    }
    if (options.to !== undefined) {
      where.starts_at[Op.lte] = new Date(options.to);
    }
  }
  const limit = Math.min(options.limit || MAX_ENTRIES_READ, MAX_ENTRIES_READ);
  const rows = await db.TariffCalendarEntry.findAll({
    where,
    order: [['starts_at', options.from === undefined && options.limit ? 'DESC' : 'ASC']],
    limit,
  });
  const entries = rows.map((row) => ({
    starts_at: new Date(row.starts_at).toISOString(),
    value: row.value_string !== null ? row.value_string : Number(row.value_number),
  }));
  return options.from === undefined && options.limit ? entries.reverse() : entries;
}

/**
 * @description Load the calendars a compiled tariff references into an in-memory lookup
 * for a run window (section 7.5). Unknown keys are simply absent from the lookup: the
 * engine then applies the fallback of the component.
 * @param {Array<string>} keys - Calendar keys.
 * @param {number} fromMs - Window start (ms).
 * @param {number} toMs - Window end (ms).
 * @param {string} defaultTimezone - Timezone of the contract.
 * @returns {Promise<object>} The lookup (createCalendarLookup).
 * @example
 * await loadCalendarLookup(['tempo'], Date.UTC(2026, 0, 1), Date.UTC(2026, 1, 1), 'Europe/Paris');
 */
async function loadCalendarLookup(keys, fromMs, toMs, defaultTimezone) {
  if (!keys || keys.length === 0) {
    return createCalendarLookup({}, [], defaultTimezone);
  }
  const rows = await db.TariffCalendar.findAll({ where: { key: { [Op.in]: keys } } });
  const definitions = {};
  rows.forEach((row) => {
    definitions[row.key] = {
      granularity: row.granularity,
      timezone: row.timezone,
      day_starts_at: row.day_starts_at,
    };
  });
  const entryRows = await db.TariffCalendarEntry.findAll({
    where: {
      calendar_key: { [Op.in]: Object.keys(definitions) },
      // a daily value can start applying two days before (day_starts_at, DST)
      starts_at: { [Op.gte]: new Date(fromMs - 2 * ONE_DAY_MS), [Op.lte]: new Date(toMs + ONE_DAY_MS) },
    },
    attributes: ['calendar_key', 'starts_at', 'value_string', 'value_number'],
  });
  const entries = entryRows.map((row) => ({
    calendar_key: row.calendar_key,
    starts_at: new Date(row.starts_at).getTime(),
    value: row.value_string !== null ? row.value_string : Number(row.value_number),
  }));
  return createCalendarLookup(definitions, entries, defaultTimezone);
}

/**
 * @description Purge the calendar entries older than a date: the core only keeps the useful
 * window (the oldest consumption state of the instance minus one day, section 4).
 * @param {Date} before - Delete the entries starting before this instant.
 * @returns {Promise<number>} Number of deleted entries.
 * @example
 * await purgeCalendarEntries(new Date('2021-01-01'));
 */
async function purgeCalendarEntries(before) {
  const count = await db.TariffCalendarEntry.destroy({ where: { starts_at: { [Op.lt]: before } } });
  if (count > 0) {
    logger.info(`Purged ${count} tariff calendar entries older than ${before.toISOString()}`);
    const calendars = await db.TariffCalendar.findAll();
    await Promise.all(
      calendars.map(async (calendar) => {
        const first = await db.TariffCalendarEntry.findOne({
          where: { calendar_key: calendar.key },
          order: [['starts_at', 'ASC']],
        });
        await calendar.update({ first_at: first ? first.starts_at : null });
      }),
    );
  }
  return count;
}

module.exports = { getCalendars, getCalendar, getCalendarEntries, loadCalendarLookup, purgeCalendarEntries };
