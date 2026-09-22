// Helpers shared by the Contracts tab: 30-minute slot grid <-> tariff time intervals,
// template labels, currency formatting.

export const SLOTS_PER_DAY = 48;

export const slotToLabel = slot => {
  const minutes = (slot * 30) % (24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const labelToMinutes = label => {
  const [h, m] = String(label)
    .split(':')
    .map(Number);
  return h * 60 + m;
};

// [["22:00", "06:00"]] -> Set of slot indexes
export const intervalsToSlots = intervals => {
  const slots = new Set();
  (Array.isArray(intervals) ? intervals : []).forEach(interval => {
    if (!Array.isArray(interval) || interval.length !== 2) {
      return;
    }
    const start = labelToMinutes(interval[0]);
    let end = labelToMinutes(interval[1]);
    if (end <= start) {
      end += 24 * 60;
    }
    for (let minutes = start; minutes < end; minutes += 30) {
      slots.add((minutes % (24 * 60)) / 30);
    }
  });
  return slots;
};

// Set of slot indexes -> merged [["22:00", "06:00"]] intervals (a run crossing midnight is one interval)
export const slotsToIntervals = slots => {
  const intervals = [];
  let start = null;
  for (let slot = 0; slot < SLOTS_PER_DAY; slot += 1) {
    if (slots.has(slot) && start === null) {
      start = slot;
    }
    if (!slots.has(slot) && start !== null) {
      intervals.push([slotToLabel(start), slotToLabel(slot)]);
      start = null;
    }
  }
  if (start !== null) {
    intervals.push([slotToLabel(start), '24:00']);
  }
  if (intervals.length > 1 && intervals[0][0] === '00:00' && intervals[intervals.length - 1][1] === '24:00') {
    const first = intervals.shift();
    const last = intervals.pop();
    intervals.push([last[0], first[1]]);
  }
  return intervals;
};

// multi-language text of a template or an input, in the user's language, english otherwise
export const localize = (text, language) => {
  if (text === null || text === undefined) {
    return '';
  }
  if (typeof text === 'string') {
    return text;
  }
  return text[language] || text.en || Object.values(text)[0] || '';
};

export const formatMoney = (value, currency, digits = 4) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: digits
    }).format(value);
  } catch (e) {
    return `${Number(value).toFixed(digits)} ${currency || ''}`;
  }
};

export const CONTRACT_STATUS_BADGE = {
  active: 'badge-success',
  scheduled: 'badge-info',
  expired: 'badge-secondary',
  orphaned: 'badge-danger'
};

export const PROVIDER_BADGE = {
  community: 'badge-primary',
  integration: 'badge-purple',
  internal: 'badge-info',
  user: 'badge-secondary'
};

// the meters a contract can be attached to: any device carrying an energy sensor feature
export const getMeterDevices = devices =>
  (devices || []).filter(
    device => Array.isArray(device.features) && device.features.some(feature => feature.category === 'energy-sensor')
  );

export const defaultInputValues = inputs => {
  const values = {};
  (inputs || []).forEach(input => {
    if (input.default !== undefined) {
      values[input.key] = input.default;
    } else if (input.type === 'select' && Array.isArray(input.options) && input.options.length > 0) {
      values[input.key] = input.options[0];
    } else if (input.type === 'time_intervals') {
      values[input.key] = [];
    }
  });
  return values;
};

// the message of an API error, with the JSON path of a tariff error when the server gives one
export const errorMessage = e => {
  if (e && e.response && e.response.data) {
    const { data } = e.response;
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (data.error && typeof data.error.message === 'string') {
      return data.error.message;
    }
    return JSON.stringify(data);
  }
  return e && e.message ? e.message : String(e);
};
