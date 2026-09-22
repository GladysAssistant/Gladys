const { Op } = require('sequelize');
const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError } = require('../../utils/coreErrors');
const { TARIFF_CALENDAR_GRANULARITIES, EVENTS } = require('../../utils/constants');
const { DATE_REGEX } = require('./tariff.constants');
const { localToUtcMs, getLocalContext } = require('./tariff.time');
const logger = require('../../utils/logger');

const MAX_ENTRIES_PER_CALL = 2000;
const PAST_WINDOW_MS = 5 * 365 * 24 * 60 * 60 * 1000;
const FUTURE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
// Bound of the recalculations a calendar can trigger (capability file, section 2)
const RECALCULATION_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * @description Resolve the start instant of an entry: `starts_at` (ISO), or `date`
 * (`YYYY-MM-DD`, local midnight of the calendar timezone) for a daily calendar.
 * @param {object} entry - The entry.
 * @param {object} calendar - The calendar row.
 * @param {number} index - Index in the batch (for the error message).
 * @returns {number} Milliseconds since the epoch.
 * @example
 * resolveStartsAt({ date: '2026-01-12' }, calendar, 0);
 */
function resolveStartsAt(entry, calendar, index) {
  if (entry.date !== undefined) {
    if (typeof entry.date !== 'string' || !DATE_REGEX.test(entry.date)) {
      throw new BadParameters(`entries[${index}].date: must be a YYYY-MM-DD date`);
    }
    if (calendar.granularity !== TARIFF_CALENDAR_GRANULARITIES.DAY) {
      throw new BadParameters(`entries[${index}].date: a thirty_minutes calendar takes starts_at`);
    }
    return localToUtcMs(entry.date, calendar.timezone);
  }
  const ms = new Date(entry.starts_at).getTime();
  if (Number.isNaN(ms)) {
    throw new BadParameters(`entries[${index}].starts_at: must be an ISO date`);
  }
  if (calendar.granularity === TARIFF_CALENDAR_GRANULARITIES.DAY) {
    const local = getLocalContext(ms, calendar.timezone);
    if (local.minutes !== 0 || ms % 60000 !== 0) {
      throw new BadParameters(`entries[${index}].starts_at: must be a local midnight of ${calendar.timezone}`);
    }
  } else if (ms % THIRTY_MINUTES_MS !== 0) {
    throw new BadParameters(`entries[${index}].starts_at: must be aligned on a 30-minute slot`);
  }
  return ms;
}

/**
 * @description Validate one entry against the calendar: string value within the declared
 * enum, or numeric price for a price calendar.
 * @param {object} entry - The entry ({ starts_at | date, value | price }).
 * @param {object} calendar - The calendar row.
 * @param {number} index - Index in the batch.
 * @returns {object} { starts_at, value_string, value_number }.
 * @example
 * normalizeEntry({ date: '2026-01-12', value: 'red' }, calendar, 0);
 */
function normalizeEntry(entry, calendar, index) {
  if (entry === null || typeof entry !== 'object') {
    throw new BadParameters(`entries[${index}]: must be an object`);
  }
  const startsAt = resolveStartsAt(entry, calendar, index);
  const hasValue = entry.value !== undefined && entry.value !== null;
  const hasPrice = entry.price !== undefined && entry.price !== null;
  if (hasValue === hasPrice) {
    throw new BadParameters(`entries[${index}]: exactly one of value or price is required`);
  }
  if (hasValue) {
    if (typeof entry.value !== 'string' || entry.value.length === 0 || entry.value.length > 64) {
      throw new BadParameters(`entries[${index}].value: must be a string of 1 to 64 characters`);
    }
    if (calendar.values && !calendar.values.includes(entry.value)) {
      throw new BadParameters(`entries[${index}].value: "${entry.value}" is not in [${calendar.values.join(', ')}]`);
    }
    return { starts_at: startsAt, value_string: entry.value, value_number: null };
  }
  if (typeof entry.price !== 'number' || !Number.isFinite(entry.price)) {
    throw new BadParameters(`entries[${index}].price: must be a finite number`);
  }
  if (calendar.values) {
    throw new BadParameters(`entries[${index}].price: calendar "${calendar.key}" takes string values`);
  }
  if (entry.currency !== undefined && calendar.currency && entry.currency !== calendar.currency) {
    throw new BadParameters(`entries[${index}].currency: calendar "${calendar.key}" is in ${calendar.currency}`);
  }
  return { starts_at: startsAt, value_string: null, value_number: entry.price };
}

/**
 * @description Publish (upsert) the entries of a calendar. The caller must own the calendar
 * (`providerServiceId`, or `null` for the core itself: catalogue import, tests). Returns the
 * number of entries written and the earliest instant whose value changed, and queues a bounded
 * cost recalculation of the meters whose contracts reference the calendar.
 * @param {string} key - Calendar key.
 * @param {Array<object>} entries - [{ starts_at | date, value | price }].
 * @param {object} [options] - Options: `provider_service_id` (owner check, skipped when undefined),
 * `skip_recalculation` (boolean).
 * @returns {Promise<object>} { count, changed_from }.
 * @example
 * await publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'red' }], { provider_service_id: serviceId });
 */
async function publishCalendarEntries(key, entries, options = {}) {
  const calendar = await db.TariffCalendar.findByPk(key);
  if (calendar === null) {
    throw new NotFoundError(`calendar "${key}" is not declared`);
  }
  if (options.provider_service_id !== undefined && calendar.provider_service_id !== options.provider_service_id) {
    throw new ForbiddenError(`calendar "${key}" is not provided by this integration`);
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new BadParameters('entries: must be a non-empty array');
  }
  if (entries.length > MAX_ENTRIES_PER_CALL) {
    throw new BadParameters(`entries: at most ${MAX_ENTRIES_PER_CALL} entries per call`);
  }
  const now = Date.now();
  const normalized = entries.map((entry, index) => {
    const value = normalizeEntry(entry, calendar, index);
    if (value.starts_at < now - PAST_WINDOW_MS || value.starts_at > now + FUTURE_WINDOW_MS) {
      throw new BadParameters(`entries[${index}]: starts_at must be between 5 years ago and 7 days ahead`);
    }
    return value;
  });
  const startsAts = normalized.map((e) => new Date(e.starts_at));
  const existingRows = await db.TariffCalendarEntry.findAll({
    where: { calendar_key: key, starts_at: { [Op.in]: startsAts } },
  });
  const existingByMs = new Map(existingRows.map((row) => [new Date(row.starts_at).getTime(), row]));
  let changedFrom = null;
  await db.sequelize.transaction(async (transaction) => {
    // Sequential on purpose: SQLite serializes writes anyway
    // eslint-disable-next-line no-restricted-syntax
    for (const entry of normalized) {
      const existing = existingByMs.get(entry.starts_at);
      const changed =
        !existing ||
        existing.value_string !== entry.value_string ||
        Number(existing.value_number) !== Number(entry.value_number);
      if (changed && (changedFrom === null || entry.starts_at < changedFrom)) {
        changedFrom = entry.starts_at;
      }
      if (!existing) {
        // eslint-disable-next-line no-await-in-loop
        await db.TariffCalendarEntry.create(
          { calendar_key: key, starts_at: new Date(entry.starts_at), ...entry, starts_at_ms: undefined },
          { transaction },
        );
      } else if (changed) {
        // eslint-disable-next-line no-await-in-loop
        await existing.update({ value_string: entry.value_string, value_number: entry.value_number }, { transaction });
      }
    }
    const firstMs = Math.min(...normalized.map((e) => e.starts_at));
    const lastMs = Math.max(...normalized.map((e) => e.starts_at));
    await calendar.update(
      {
        first_at:
          calendar.first_at === null || firstMs < new Date(calendar.first_at).getTime()
            ? new Date(firstMs)
            : calendar.first_at,
        last_at:
          calendar.last_at === null || lastMs > new Date(calendar.last_at).getTime()
            ? new Date(lastMs)
            : calendar.last_at,
      },
      { transaction },
    );
  });
  const result = { count: normalized.length, changed_from: changedFrom === null ? null : new Date(changedFrom) };
  if (changedFrom !== null && !options.skip_recalculation) {
    await this.requestCalendarRecalculation(key, result.changed_from);
  }
  return result;
}

/**
 * @description Queue a cost recalculation for the meters whose active contract references a
 * calendar, bounded to one per calendar per 10 minutes: a request within the window is merged
 * into the next one (its `from` is kept if earlier).
 * @param {string} key - Calendar key.
 * @param {Date} from - Recompute from this instant.
 * @returns {Promise<void>} Resolves when queued.
 * @example
 * await requestCalendarRecalculation('tempo', new Date('2026-01-12T05:00:00Z'));
 */
async function requestCalendarRecalculation(key, from) {
  const state = this.calendarRecalculations.get(key) || { last_at: 0, timer: null, from: null };
  state.from = state.from === null || from < state.from ? from : state.from;
  this.calendarRecalculations.set(key, state);
  const run = async () => {
    state.timer = null;
    state.last_at = Date.now();
    const pendingFrom = state.from;
    state.from = null;
    const contracts = await db.EnergyContract.findAll({ attributes: ['electric_meter_device_id', 'tariff'] });
    const meterIds = contracts
      .filter((c) => Array.isArray(c.tariff.calendars) && c.tariff.calendars.includes(key))
      .map((c) => c.electric_meter_device_id);
    if (meterIds.length === 0) {
      return;
    }
    logger.info(
      `Calendar "${key}" changed from ${pendingFrom.toISOString()}: recalculating ${meterIds.length} meter(s)`,
    );
    this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, {
      from: pendingFrom,
      electric_meter_device_ids: Array.from(new Set(meterIds)),
      calendar_key: key,
    });
  };
  const elapsed = Date.now() - state.last_at;
  if (elapsed >= RECALCULATION_MIN_INTERVAL_MS) {
    await run();
  } else if (state.timer === null) {
    state.timer = setTimeout(() => {
      run().catch((e) => logger.warn(`Calendar "${key}" recalculation failed: ${e.message}`));
    }, RECALCULATION_MIN_INTERVAL_MS - elapsed);
  }
}

module.exports = {
  publishCalendarEntries,
  requestCalendarRecalculation,
  normalizeEntry,
  MAX_ENTRIES_PER_CALL,
  RECALCULATION_MIN_INTERVAL_MS,
};
