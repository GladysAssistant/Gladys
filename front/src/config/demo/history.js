import dayjs from 'dayjs';

import { findFeature } from './home';
import { uuid, solarRatio } from './helpers';

/**
 * Time series of the demo: chart data, activity history and energy
 * consumption.
 *
 * They are generated from the current value of each feature so a curve always
 * ends on the value displayed by the widgets, and always stops "now" whatever
 * the day the demo is opened.
 */

// Number of points returned for a chart, per interval of the chart widget
const INTERVALS = {
  'last-hour': { minutes: 60, points: 60 },
  'last-twelve-hours': { minutes: 12 * 60, points: 72 },
  'last-day': { minutes: 24 * 60, points: 96 },
  'last-week': { minutes: 7 * 24 * 60, points: 84 },
  'last-month': { minutes: 30 * 24 * 60, points: 90 },
  'last-three-months': { minutes: 90 * 24 * 60, points: 90 },
  'last-year': { minutes: 365 * 24 * 60, points: 120 }
};

const intervalFromMinutes = minutes => {
  const found = Object.values(INTERVALS).find(interval => interval.minutes === Number(minutes));
  return found || INTERVALS['last-day'];
};

// Peak power of the demo solar installation, used to draw a past day when the
// current production carries no scale (at night)
const DEFAULT_SOLAR_PEAK_WATT = 3400;

const noise = seed => {
  const value = Math.sin(seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

/**
 * Amplitude and shape of the variation of a feature around its current value.
 * A temperature waves along the day, solar production only exists between
 * sunrise and sunset, a battery slowly drifts: this keeps every chart of the
 * demo believable.
 */
const shapeOf = feature => {
  switch (feature.category) {
    case 'temperature-sensor':
      return { amplitude: 2.5, daily: true, decimals: 1, min: -10 };
    case 'humidity-sensor':
      return { amplitude: 8, daily: true, decimals: 0, min: 0, max: 100 };
    case 'co2-sensor':
      return { amplitude: 220, daily: true, decimals: 0, min: 400 };
    case 'energy-production-sensor':
      return { solar: true, decimals: 0, min: 0 };
    case 'energy-sensor':
      return { amplitude: feature.last_value * 0.6 || 500, daily: true, decimals: 0, min: 0 };
    case 'battery':
    case 'battery-storage':
      return { amplitude: 15, daily: true, decimals: 0, min: 0, max: 100 };
    case 'light-sensor':
      return { solar: true, decimals: 0, min: 0 };
    default:
      return { amplitude: Math.max(1, (feature.last_value || 10) * 0.2), daily: false, decimals: 1, min: null };
  }
};

const valueAt = (feature, date, index) => {
  const shape = shapeOf(feature);
  const base = typeof feature.last_value === 'number' ? feature.last_value : 0;
  const day = dayjs(date);
  const hour = day.hour() + day.minute() / 60;
  // A perfect sine would read as generated data: each day gets its own level
  // (a colder day, a cloudier day) and each point a bit of sensor jitter
  const dayLevel = noise(day.date() * 7 + day.month()) - 0.5;
  const jitter = (noise(index + base) - 0.5) * 0.18;
  let value;
  if (shape.solar) {
    // The current value of the feature is already the production of this very
    // hour, so the peak of the day is read back from it. At night it carries no
    // information (it is zero), and a default peak draws the past days.
    const now = dayjs();
    const ratioNow = solarRatio(now.hour() + now.minute() / 60);
    const peak = base > 0 && ratioNow > 0.2 ? base / ratioNow : DEFAULT_SOLAR_PEAK_WATT;
    value = peak * solarRatio(hour) * (1 + jitter + dayLevel * 0.5);
  } else {
    const dailyWave = shape.daily ? Math.sin(((hour - 9) / 24) * 2 * Math.PI) : 0;
    value = base + shape.amplitude * (dailyWave + jitter + dayLevel * 0.9);
  }
  if (shape.min !== null && shape.min !== undefined && value < shape.min) {
    value = shape.min;
  }
  if (shape.max !== undefined && value > shape.max) {
    value = shape.max;
  }
  return Math.round(value * 10 ** shape.decimals) / 10 ** shape.decimals;
};

/**
 * `GET /device_feature/aggregated_states`: one series per requested feature.
 */
const getAggregatedStates = (query = {}) => {
  const selectors = (query.device_features || '').split(',').filter(selector => selector.length > 0);
  const interval = intervalFromMinutes(query.interval);
  const step = interval.minutes / interval.points;
  const offset = Number(query.offset) || 0;
  const end = dayjs().subtract(offset, 'minute');

  return selectors.map(selector => {
    const found = findFeature(selector);
    if (!found) {
      return { device: { name: selector }, deviceFeature: { name: selector, selector }, values: [] };
    }
    const values = [];
    for (let index = interval.points; index >= 0; index -= 1) {
      const createdAt = end.subtract(index * step, 'minute');
      const value = valueAt(found.feature, createdAt, index);
      values.push({
        created_at: createdAt.toISOString(),
        value,
        min_value: value,
        max_value: value,
        sum_value: value,
        count_value: 1
      });
    }
    return {
      device: { name: found.device.name, selector: found.device.selector },
      deviceFeature: {
        name: found.feature.name,
        selector: found.feature.selector,
        unit: found.feature.unit,
        category: found.feature.category,
        type: found.feature.type
      },
      values
    };
  });
};

/**
 * `GET /device_feature/energy_consumption`: daily consumption in kWh, with a
 * cost per period so the widget can display prices too.
 */
const getEnergyConsumption = (query = {}) => {
  const selectors = (query.device_features || '').split(',').filter(selector => selector.length > 0);
  const from = query.from ? dayjs(query.from) : dayjs().subtract(7, 'day');
  const to = query.to ? dayjs(query.to) : dayjs();
  const groupBy = query.group_by || 'day';
  const stepMinutes = { hour: 60, day: 24 * 60, week: 7 * 24 * 60, month: 30 * 24 * 60 }[groupBy] || 24 * 60;
  const isCost = query.display_mode === 'currency';

  return selectors.map(selector => {
    const found = findFeature(selector);
    const values = [];
    let cursor = from.startOf(groupBy === 'hour' ? 'hour' : 'day');
    let index = 0;
    while (cursor.isBefore(to)) {
      const kwh = Math.round((6 + noise(index + 3) * 8) * 100) / 100;
      values.push({
        created_at: cursor.toISOString(),
        sum_value: isCost ? Math.round(kwh * 0.2016 * 100) / 100 : kwh
      });
      cursor = cursor.add(stepMinutes, 'minute');
      index += 1;
    }
    return {
      device: { name: found ? found.device.name : selector },
      deviceFeature: {
        name: found ? found.feature.name : selector,
        selector,
        unit: isCost ? null : 'kilowatt-hour',
        currency_unit: 'euro',
        is_subscription: false
      },
      values
    };
  });
};

/**
 * `GET /device_feature/states_csv`: the CSV export offered by the chart widget
 * and the device list. The demo has no database, so the file is drawn from the
 * same generated curves as the charts, on one point every ten minutes over the
 * exported period.
 */
const CSV_SEPARATOR = ',';
const CSV_HEADER = ['date', 'device', 'feature', 'unit', 'value'].join(CSV_SEPARATOR);
const CSV_POINT_EVERY_MINUTES = 10;
// The demo file is built in the browser: a year exported minute by minute would
// freeze the tab, so the period is sampled to at most this many points.
const CSV_MAX_POINTS_PER_FEATURE = 2000;

const escapeCsvValue = value => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildStatesCsv = (query = {}) => {
  const selectors = [...new Set((query.device_features || '').split(',').filter(selector => selector.length > 0))];
  const end = query.end ? dayjs(query.end) : dayjs();
  const start = query.start ? dayjs(query.start) : end.subtract(1, 'day');
  const totalMinutes = Math.max(end.diff(start, 'minute'), 0);
  // Both endpoints count toward the cap, so a feature never exceeds it
  const sampleCount = Math.min(Math.floor(totalMinutes / CSV_POINT_EVERY_MINUTES) + 1, CSV_MAX_POINTS_PER_FEATURE);
  const step = sampleCount > 1 ? totalMinutes / (sampleCount - 1) : 0;

  const rows = [];
  selectors.forEach(selector => {
    const found = findFeature(selector);
    if (!found) {
      return;
    }
    for (let index = 0; index < sampleCount; index += 1) {
      const createdAt = start.add(index * step, 'minute');
      rows.push({
        createdAt,
        deviceName: found.device.name,
        featureName: found.feature.name,
        unit: found.feature.unit,
        value: valueAt(found.feature, createdAt, index)
      });
    }
  });

  rows.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());

  const lines = rows.map(row =>
    [
      row.createdAt.toISOString(),
      escapeCsvValue(row.deviceName),
      escapeCsvValue(row.featureName),
      escapeCsvValue(row.unit),
      escapeCsvValue(row.value)
    ].join(CSV_SEPARATOR)
  );

  return [CSV_HEADER, ...lines].join('\n');
};

/*
 * The real server answers this route in chunks ({ csv, next, states }) when
 * `max_states` is passed, which is how the web client always calls it. The demo
 * file is small enough to fit in one chunk, so the first answer is also the
 * last: the whole file, and no cursor.
 */
const getStatesCsv = (query = {}) => {
  const csv = buildStatesCsv(query);
  if (query.max_states === undefined) {
    return csv;
  }
  return { csv, next: null, states: Math.max(csv.split('\n').length - 1, 0) };
};

/**
 * `GET /device_feature/states_history`: the activity page. States are spread
 * over the last days, newest first, and the window asked by the page
 * ([since, before)) is honoured so its progressive search terminates.
 */
const HISTORY_FEATURES = [
  { selector: 'living-room-motion', values: [1, 0], everyMinutes: 37 },
  { selector: 'office-presence', values: [1, 0], everyMinutes: 53 },
  { selector: 'kitchen-window-opening', values: [1, 0], everyMinutes: 197 },
  { selector: 'living-room-ceiling-light-binary', values: [1, 0], everyMinutes: 149 },
  { selector: 'kitchen-spots-binary', values: [1, 0], everyMinutes: 173 },
  { selector: 'living-room-temperature', values: null, everyMinutes: 61 },
  { selector: 'outdoor-temperature', values: null, everyMinutes: 67 },
  { selector: 'home-power', values: null, everyMinutes: 29 },
  { selector: 'solar-power', values: null, everyMinutes: 31 },
  { selector: 'garage-door-lock', values: [1, 0], everyMinutes: 421 }
];

const HISTORY_DAYS = 4;

const buildHistory = () => {
  const events = [];
  HISTORY_FEATURES.forEach(({ selector, values, everyMinutes }) => {
    const found = findFeature(selector);
    if (!found) {
      return;
    }
    const total = Math.floor((HISTORY_DAYS * 24 * 60) / everyMinutes);
    for (let index = 0; index < total; index += 1) {
      const createdAt = dayjs().subtract(index * everyMinutes + 2, 'minute');
      events.push({
        id: uuid(`state-${selector}-${index}`),
        value: values ? values[index % values.length] : valueAt(found.feature, createdAt, index),
        created_at: createdAt.toISOString(),
        device_feature: {
          id: found.feature.id,
          name: found.feature.name,
          selector: found.feature.selector,
          category: found.feature.category,
          type: found.feature.type,
          unit: found.feature.unit
        },
        device: { name: found.device.name, selector: found.device.selector },
        room: found.device.room ? { name: found.device.room.name, selector: found.device.room.selector } : null
      });
    }
  });
  return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

let history = null;

const getStatesHistory = (query = {}) => {
  if (!history) {
    history = buildHistory();
  }
  const before = query.before ? new Date(query.before) : null;
  const since = query.since ? new Date(query.since) : null;
  const take = Number(query.take) || 80;
  const deviceFeatures = query.device_features ? query.device_features.split(',') : null;
  return history
    .filter(state => {
      const createdAt = new Date(state.created_at);
      if (before && createdAt >= before) {
        return false;
      }
      if (since && createdAt < since) {
        return false;
      }
      if (deviceFeatures && !deviceFeatures.includes(state.device_feature.selector)) {
        return false;
      }
      return true;
    })
    .slice(0, take);
};

export { getAggregatedStates, getEnergyConsumption, getStatesCsv, getStatesHistory };
