// The price-row cost calculation of Gladys before the energy contracts (the three
// hardcoded contract types), kept only to verify the migration (section 9.3): the
// last 7 days of each meter are priced with this code and with the engine, and a gap
// above 0.5% is reported on the contract. Removed two releases after the migration.
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { ENERGY_CONTRACT_TYPES, ENERGY_PRICE_TYPES } = require('../../../utils/constants');
const { PRICE_SCALE } = require('./convertPriceRows');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description Convert a Date to an HH:MM slot label at 30-minute granularity.
 * @param {Date} date - The date of the consumption sample.
 * @param {string} systemTimezone - The timezone of the system.
 * @returns {string} The label formatted as HH:MM (minutes are 00 or 30).
 * @example
 * formatDateToSlotLabel(new Date('2025-09-11T17:14:57+02:00'), 'Europe/Paris');
 */
function formatDateToSlotLabel(date, systemTimezone) {
  const dayjsDate = dayjs(date).tz(systemTimezone);
  const hour = dayjsDate.hour();
  const minutes = dayjsDate.minute() >= 30 ? '30' : '00';
  const hh = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hh}:${minutes}`;
}

/**
 * @description Find the row whose hour slots contain the label.
 * @param {Array<object>} rows - Price rows.
 * @param {string} label - HH:MM slot label.
 * @returns {object|undefined} The row.
 * @example
 * findRowForSlot(rows, '22:00');
 */
function findRowForSlot(rows, label) {
  return rows.find((p) =>
    String(p.hour_slots || '')
      .split(',')
      .map((s) => s.trim())
      .includes(label),
  );
}

/**
 * @description Price one consumption interval with the legacy rules.
 * @param {Array<object>} rows - The consumption rows valid at the date.
 * @param {Date} consumptionDate - Interval start.
 * @param {number} kwh - Energy.
 * @param {string} systemTimezone - System timezone.
 * @param {Map<string, string>} tempoDayMap - Tempo colour per local date.
 * @returns {number|null} The cost, null when the legacy code would have failed.
 * @example
 * legacyCost(rows, new Date(), 1, 'Europe/Paris', new Map());
 */
function legacyCost(rows, consumptionDate, kwh, systemTimezone, tempoDayMap) {
  const consumptionRows = rows.filter((r) => r.price_type === ENERGY_PRICE_TYPES.CONSUMPTION);
  if (consumptionRows.length === 0) {
    return null;
  }
  const { contract } = consumptionRows[0];
  if (contract === ENERGY_CONTRACT_TYPES.BASE) {
    return (consumptionRows[0].price / PRICE_SCALE) * kwh;
  }
  const label = formatDateToSlotLabel(consumptionDate, systemTimezone);
  if (contract === ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK) {
    const row = findRowForSlot(consumptionRows, label);
    return row ? (row.price / PRICE_SCALE) * kwh : null;
  }
  let dateForColor = dayjs(consumptionDate).tz(systemTimezone);
  if (dateForColor.hour() < 6) {
    dateForColor = dateForColor.subtract(1, 'day');
  }
  const colour = tempoDayMap.get(dateForColor.format('YYYY-MM-DD'));
  if (!colour) {
    return null;
  }
  const row = findRowForSlot(
    consumptionRows.filter((p) => p.day_type === colour),
    label,
  );
  return row ? (row.price / PRICE_SCALE) * kwh : null;
}

module.exports = { legacyCost, formatDateToSlotLabel };
