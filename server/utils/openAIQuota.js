const dayjs = require('dayjs');
const durationPlugin = require('dayjs/plugin/duration');

dayjs.extend(durationPlugin);

const UNIT_LABELS = {
  fr: {
    day: 'j',
    hour: 'h',
    minute: 'min',
    second: 's',
  },
  en: {
    day: 'd',
    hour: 'h',
    minute: 'min',
    second: 's',
  },
  de: {
    day: 'T',
    hour: 'Std',
    minute: 'Min',
    second: 'Sek',
  },
};

/**
 * @description Format remaining seconds before quota reset.
 * @param {number} seconds - Remaining seconds before reset.
 * @param {string} [language='en'] - User language code.
 * @returns {string} Human-readable duration.
 * @example
 * formatResetDuration(125, 'fr');
 */
function formatResetDuration(seconds, language = 'en') {
  if (!seconds || seconds <= 0) {
    return '';
  }

  const labels = UNIT_LABELS[language] || UNIT_LABELS.en;
  const duration = dayjs.duration(seconds, 'seconds');
  const parts = [];

  if (duration.days() > 0) {
    parts.push(`${duration.days()}${labels.day}`);
  }
  if (duration.hours() > 0) {
    parts.push(`${duration.hours()}${labels.hour}`);
  }
  if (duration.minutes() > 0) {
    parts.push(`${duration.minutes()}${labels.minute}`);
  }
  if (duration.seconds() > 0 || parts.length === 0) {
    parts.push(`${duration.seconds()}${labels.second}`);
  }

  return parts.join(' ');
}

/**
 * @description Compute used quota percentage from remaining and max values.
 * @param {{ remaining: number, max: number }} quota - Quota object.
 * @returns {number} Used percentage between 0 and 100.
 * @example
 * getQuotaUsedPercent({ remaining: 75, max: 100 });
 */
function getQuotaUsedPercent(quota) {
  if (!quota || !quota.max) {
    return 0;
  }

  const used = quota.max - quota.remaining;
  return Math.min(100, Math.max(0, Math.round((used / quota.max) * 100)));
}

/**
 * @description Return Bootstrap progress bar class based on quota usage.
 * @param {{ remaining: number, max: number }} quota - Quota object.
 * @returns {string} Bootstrap background class.
 * @example
 * getQuotaProgressBarClass({ remaining: 10, max: 100 });
 */
function getQuotaProgressBarClass(quota) {
  if (!quota || !quota.max) {
    return 'bg-secondary';
  }

  const usedPercent = getQuotaUsedPercent(quota);

  if (quota.remaining <= 0 || usedPercent >= 100) {
    return 'bg-danger';
  }
  if (usedPercent >= 80) {
    return 'bg-warning';
  }
  return 'bg-success';
}

module.exports = {
  formatResetDuration,
  getQuotaUsedPercent,
  getQuotaProgressBarClass,
};
