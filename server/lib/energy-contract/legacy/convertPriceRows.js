// Translation of the price-row model (t_energy_price rows, catalogue v1 entries) into a
// tariff definition of the rule engine: docs/specs/energy-contracts.md, section 9.2.
const { ENERGY_CONTRACT_TYPES, ENERGY_PRICE_TYPES } = require('../../../utils/constants');

const PRICE_SCALE = 10000;
const TEMPO_COLOURS = ['red', 'white', 'blue'];
const OFF_PEAK_INPUT = 'off_peak_slots';
const SLOT_MINUTES = 30;

/**
 * @description Convert a legacy `contract` value (`edf-tempo` in the database, `edf_tempo`
 * in the catalogue) into the core enum.
 * @param {string} contract - Legacy contract type.
 * @returns {string} Normalized contract type.
 * @example
 * normalizeContractType('edf_tempo'); // 'edf-tempo'
 */
function normalizeContractType(contract) {
  return contract === 'edf_tempo' ? ENERGY_CONTRACT_TYPES.EDF_TEMPO : contract;
}

/**
 * @description Convert a legacy `hour_slots` string ("22:00,22:30,…", or legacy slot indexes)
 * into merged `time` intervals of the tariff grammar.
 * @param {string} hourSlots - Comma separated slot labels.
 * @returns {Array<Array<string>>} [["22:00", "06:00"], …].
 * @example
 * hourSlotsToTimeIntervals('22:00,22:30,23:00,23:30,00:00'); // [['22:00', '00:30']]
 */
function hourSlotsToTimeIntervals(hourSlots) {
  const slots = new Set();
  String(hourSlots || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((label) => {
      if (/^\d{1,2}:\d{2}$/.test(label)) {
        const [h, m] = label.split(':').map(Number);
        slots.add(h * 2 + (m >= 30 ? 1 : 0));
      } else if (/^\d{1,2}$/.test(label)) {
        const index = Number(label);
        // legacy hour indexes (0-23) or slot indexes (0-47): both are unambiguous below 24 as hours
        if (index < 24) {
          slots.add(index * 2);
          slots.add(index * 2 + 1);
        } else if (index < 48) {
          slots.add(index);
        }
      }
    });
  const format = (slot) => {
    const minutes = (slot * SLOT_MINUTES) % 1440;
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const intervals = [];
  let start = null;
  for (let slot = 0; slot < 48; slot += 1) {
    if (slots.has(slot) && start === null) {
      start = slot;
    }
    if (!slots.has(slot) && start !== null) {
      intervals.push([format(start), format(slot)]);
      start = null;
    }
  }
  if (start !== null) {
    intervals.push([format(start), '24:00']);
  }
  // A run crossing midnight is one interval: merge a leading [00:00, x] with a trailing [y, 24:00]
  if (intervals.length > 1 && intervals[0][0] === '00:00' && intervals[intervals.length - 1][1] === '24:00') {
    const first = intervals.shift();
    const last = intervals.pop();
    intervals.push([last[0], first[1]]);
  }
  return intervals;
}

/**
 * @description Count the 30-minute slots of a legacy `hour_slots` string.
 * @param {string} hourSlots - Comma separated slot labels.
 * @returns {number} Number of slots.
 * @example
 * countSlots('22:00,22:30'); // 2
 */
function countSlots(hourSlots) {
  return String(hourSlots || '')
    .split(',')
    .filter((s) => s.trim()).length;
}

/**
 * @description Price of a legacy row in currency units (rows store ×10,000 integers).
 * @param {object} row - Legacy price row.
 * @returns {number} Price.
 * @example
 * rowPrice({ price: 2516 }); // 0.2516
 */
function rowPrice(row) {
  return Math.round((Number(row.price) / PRICE_SCALE) * 1e6) / 1e6;
}

/**
 * @description Build the `time` condition of a legacy row: explicit intervals, or an input
 * placeholder when the catalogue left the slots to the user (`TO_REPLACE_OFF_PEAK`).
 * @param {object} row - Legacy price row.
 * @returns {object} { time, isPlaceholder, isPeakPlaceholder }.
 * @example
 * rowTime({ hour_slots: 'TO_REPLACE_OFF_PEAK' });
 */
function rowTime(row) {
  const slots = String(row.hour_slots || '');
  if (slots.includes('TO_REPLACE_OFF_PEAK')) {
    return { time: `{{input:${OFF_PEAK_INPUT}}}`, isPlaceholder: true, isPeakPlaceholder: false };
  }
  if (slots.includes('TO_REPLACE_PEAK') || slots.includes('TO_REPLACE')) {
    return { time: null, isPlaceholder: true, isPeakPlaceholder: true };
  }
  return { time: hourSlotsToTimeIntervals(slots), isPlaceholder: false, isPeakPlaceholder: false };
}

/**
 * @description Build the consumption component of a group of legacy consumption rows sharing
 * one contract type (section 9.2): `base` → fallback only; `peak-off-peak` → one rule per
 * row, the row with the most slots becoming the fallback; `edf-tempo` → colour + time rules,
 * blue off-peak as the fallback.
 * @param {Array<object>} rows - Consumption rows.
 * @param {string} contractType - Normalized contract type.
 * @returns {object} { component, inputs } where inputs lists the template inputs needed.
 * @example
 * buildConsumptionComponent(rows, 'peak-off-peak');
 */
function buildConsumptionComponent(rows, contractType) {
  const inputs = [];
  const component = { key: 'energy', kind: 'consumption', rules: [] };
  if (contractType === ENERGY_CONTRACT_TYPES.EDF_TEMPO) {
    let blueOffPeak;
    TEMPO_COLOURS.forEach((colour) => {
      // the row covering the fewest slots is the off-peak price (22:00-06:00, 16 slots),
      // the others are peak windows priced by a calendar + time rule
      const colourRows = rows
        .filter((r) => r.day_type === colour)
        .sort((a, b) => countSlots(b.hour_slots) - countSlots(a.hour_slots));
      if (colourRows.length === 0) {
        return;
      }
      const offPeak = colourRows[colourRows.length - 1];
      colourRows.slice(0, -1).forEach((peak) => {
        const { time } = rowTime(peak);
        component.rules.push({
          label: `${colour} peak`,
          when: { calendar: { tempo: colour }, ...(time && time.length > 0 ? { time } : {}) },
          price: rowPrice(peak),
        });
      });
      component.rules.push({
        label: `${colour} off-peak`,
        when: { calendar: { tempo: colour } },
        price: rowPrice(offPeak),
      });
      if (colour === 'blue') {
        blueOffPeak = rowPrice(offPeak);
      }
    });
    const lastRule = component.rules[component.rules.length - 1];
    component.fallback = { label: 'off-peak', price: blueOffPeak === undefined ? lastRule.price : blueOffPeak };
    return { component, inputs, calendars: ['tempo'] };
  }
  if (contractType === ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK) {
    const timed = rows.map((row) => ({ row, ...rowTime(row) }));
    const placeholderPeak = timed.find((t) => t.isPeakPlaceholder);
    const sorted = timed
      .filter((t) => !t.isPeakPlaceholder)
      .sort((a, b) => (Array.isArray(a.time) ? a.time.length : 1) - (Array.isArray(b.time) ? b.time.length : 1));
    let fallbackRow;
    if (placeholderPeak) {
      fallbackRow = placeholderPeak.row;
    } else {
      // the row covering the most slots is the default price
      const bySlots = [...timed].sort((a, b) => countSlots(b.row.hour_slots) - countSlots(a.row.hour_slots));
      fallbackRow = bySlots[0].row;
    }
    sorted
      .filter((t) => t.row !== fallbackRow)
      .forEach((t) => {
        if (t.isPlaceholder) {
          inputs.push({ key: OFF_PEAK_INPUT, type: 'time_intervals', required: true });
        }
        component.rules.push({ label: 'off-peak', when: { time: t.time }, price: rowPrice(t.row) });
      });
    component.fallback = { label: 'peak', price: rowPrice(fallbackRow) };
    return { component, inputs, calendars: [] };
  }
  component.fallback = { price: rowPrice(rows[0]) };
  return { component, inputs, calendars: [] };
}

/**
 * @description Convert a group of legacy price rows (one contract: same meter, name, type,
 * power and start date) into a tariff definition.
 * @param {Array<object>} rows - Legacy rows (consumption and subscription).
 * @returns {object} { tariff, inputs, contractType }.
 * @example
 * convertPriceRows(rows);
 */
function convertPriceRows(rows) {
  const contractType = normalizeContractType(rows[0].contract);
  const consumptionRows = rows.filter((r) => r.price_type === ENERGY_PRICE_TYPES.CONSUMPTION);
  const subscriptionRows = rows.filter((r) => r.price_type === ENERGY_PRICE_TYPES.SUBSCRIPTION);
  const components = [];
  let inputs = [];
  let calendars = [];
  if (consumptionRows.length > 0) {
    const built = buildConsumptionComponent(consumptionRows, contractType);
    components.push(built.component);
    inputs = built.inputs;
    calendars = built.calendars;
  } else {
    components.push({ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0 } });
  }
  if (subscriptionRows.length > 0) {
    components.push({ key: 'subscription', kind: 'fixed', amount: rowPrice(subscriptionRows[0]), per: 'month' });
  }
  const tariff = { tariff_version: 1, components };
  if (calendars.length > 0) {
    tariff.calendars = calendars;
  }
  return { tariff, inputs, contractType };
}

module.exports = {
  convertPriceRows,
  hourSlotsToTimeIntervals,
  buildConsumptionComponent,
  normalizeContractType,
  rowPrice,
  OFF_PEAK_INPUT,
  PRICE_SCALE,
};
