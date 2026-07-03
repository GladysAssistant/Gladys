import get from 'get-value';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const CATEGORY_STYLES = {
  'opening-sensor': { icon: 'unlock', color: '#3b82f6' },
  lock: { icon: 'lock', color: '#3b82f6' },
  'motion-sensor': { icon: 'activity', color: '#f59e0b' },
  'presence-sensor': { icon: 'user', color: '#f59e0b' },
  shutter: { icon: 'sidebar', color: '#8b5cf6' },
  curtain: { icon: 'sidebar', color: '#8b5cf6' },
  heater: { icon: 'thermometer', color: '#f97316' },
  thermostat: { icon: 'thermometer', color: '#f97316' },
  'air-conditioning': { icon: 'wind', color: '#06b6d4' },
  light: { icon: 'sun', color: '#fbbf24' },
  switch: { icon: 'power', color: '#fbbf24' },
  button: { icon: 'radio', color: '#a78bfa' },
  'smoke-sensor': { icon: 'alert-triangle', color: '#ef4444' },
  'leak-sensor': { icon: 'droplet', color: '#ef4444' },
  'co-sensor': { icon: 'alert-circle', color: '#ef4444' },
  'co2-sensor': { icon: 'cloud', color: '#22c55e' },
  'temperature-sensor': { icon: 'thermometer', color: '#f97316' },
  'humidity-sensor': { icon: 'droplet', color: '#06b6d4' },
  'light-sensor': { icon: 'sun', color: '#fbbf24' },
  'pressure-sensor': { icon: 'bar-chart', color: '#6366f1' },
  'energy-sensor': { icon: 'zap', color: '#eab308' },
  'pm25-sensor': { icon: 'wind', color: '#a855f7' },
  'pm10-sensor': { icon: 'wind', color: '#a855f7' },
  'airquality-sensor': { icon: 'cloud', color: '#22c55e' },
  'voc-sensor': { icon: 'cloud', color: '#84cc16' },
  siren: { icon: 'bell', color: '#ef4444' },
  tamper: { icon: 'shield-off', color: '#ef4444' },
  'battery-low': { icon: 'battery', color: '#f59e0b' },
  battery: { icon: 'battery', color: '#22c55e' },
  'rain-sensor': { icon: 'cloud-rain', color: '#60a5fa' },
  'vibration-sensor': { icon: 'smartphone', color: '#a78bfa' },
  fan: { icon: 'wind', color: '#06b6d4' },
  television: { icon: 'tv', color: '#94a3b8' },
  'vacuum-cleaner': { icon: 'disc', color: '#94a3b8' },
  cube: { icon: 'box', color: '#a78bfa' },
  input: { icon: 'toggle-left', color: '#94a3b8' },
  'child-lock': { icon: 'lock', color: '#64748b' }
};

const VALUE_ICON_OVERRIDES = {
  'opening-sensor': { 0: 'unlock', 1: 'lock' },
  lock: { 0: 'unlock', 1: 'lock', 2: 'activity', 3: 'alert-triangle' },
  'motion-sensor': { 0: 'check', 1: 'activity' },
  'presence-sensor': { 0: 'user-x', 1: 'user-check' },
  light: { 0: 'moon', 1: 'sun' },
  switch: { 0: 'power', 1: 'zap' }
};

const DEFAULT_STYLE = { icon: 'cpu', color: '#94a3b8' };

const ACTIVITY_CATEGORY_GROUPS = [
  {
    id: 'access',
    icon: 'lock',
    categories: ['opening-sensor', 'lock', 'child-lock']
  },
  {
    id: 'motion',
    icon: 'activity',
    categories: ['motion-sensor', 'presence-sensor', 'vibration-sensor']
  },
  {
    id: 'shutters',
    icon: 'sidebar',
    categories: ['shutter', 'curtain']
  },
  {
    id: 'lights',
    icon: 'sun',
    categories: ['light', 'switch', 'button']
  },
  {
    id: 'climate',
    icon: 'thermometer',
    categories: ['heater', 'thermostat', 'air-conditioning', 'fan']
  },
  {
    id: 'sensors',
    icon: 'cloud',
    categories: [
      'temperature-sensor',
      'humidity-sensor',
      'co2-sensor',
      'co-sensor',
      'light-sensor',
      'pressure-sensor',
      'energy-sensor',
      'pm25-sensor',
      'pm10-sensor',
      'airquality-sensor',
      'voc-sensor',
      'rain-sensor'
    ]
  },
  {
    id: 'security',
    icon: 'shield',
    categories: ['smoke-sensor', 'leak-sensor', 'siren', 'tamper', 'battery-low']
  }
];

const getCategoriesFromGroups = groupIds => {
  if (!groupIds || groupIds.length === 0) {
    return [];
  }

  const categories = new Set();

  ACTIVITY_CATEGORY_GROUPS.forEach(group => {
    if (groupIds.indexOf(group.id) !== -1) {
      group.categories.forEach(category => categories.add(category));
    }
  });

  return Array.from(categories);
};

const isCategoryInGroups = (category, groupIds) => {
  if (!groupIds || groupIds.length === 0) {
    return true;
  }

  return getCategoriesFromGroups(groupIds).indexOf(category) !== -1;
};

const INTEGER_VALUE_TYPES = new Set(['integer', 'click', 'push']);

const formatNumericValue = (value, unit, dictionary) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  const numericValue = Number(value);
  const formattedValue = Number.isInteger(numericValue)
    ? String(numericValue)
    : parseFloat(numericValue.toFixed(1)).toString();

  if (!unit) {
    return formattedValue;
  }

  const unitLabel = get(dictionary, `deviceFeatureUnitShort.${unit}`);
  return unitLabel ? `${formattedValue} ${unitLabel}` : `${formattedValue} ${unit}`;
};

const getValueLabelKey = (category, type, value) => {
  const customText = get({}, `deviceFeatureValue.category.${category}.${type}`);
  if (customText && customText[String(value)] !== undefined) {
    return `deviceFeatureValue.category.${category}.${type}.${value}`;
  }
  if (type === 'binary') {
    return `deviceFeatureValue.category.${category}.binary`;
  }
  return null;
};

const getStateLiveFinishedLabel = (dictionary, category, type, value) => {
  const labels = get(dictionary, `deviceFeatureAction.category.${category}.${type}.stateLiveFinished`);
  if (!labels) {
    return null;
  }
  if (labels[String(value)] !== undefined) {
    return labels[String(value)];
  }
  if (value === 0 && labels.zero) {
    return labels.zero;
  }
  if (value === 1 && labels.one) {
    return labels.one;
  }
  if (labels.other) {
    return labels.other;
  }
  return null;
};

const shouldFormatAsNumericValue = (category, type) => {
  if (type === 'binary' || type === 'state') {
    return false;
  }

  if (INTEGER_VALUE_TYPES.has(type) && category !== 'button') {
    return true;
  }

  return type === 'decimal' || type === 'brightness' || type === 'position' || type === 'angle' || type === 'volume';
};

const getActivityTitle = (entry, dictionary) => {
  const {
    device_name: deviceName,
    device_feature_category: category,
    device_feature_type: type,
    device_feature_unit: unit,
    value
  } = entry;

  const titleTemplate = get(dictionary, `activityLog.eventTitle.${category}.${type}.${String(value)}`);
  if (titleTemplate) {
    return titleTemplate.replace('{{deviceName}}', deviceName);
  }

  const stateLabel = getStateLiveFinishedLabel(dictionary, category, type, value);
  if (stateLabel) {
    return `${deviceName} ${stateLabel.charAt(0).toLowerCase()}${stateLabel.slice(1)}`;
  }

  const valueKey = getValueLabelKey(category, type, value);
  if (valueKey) {
    const valueLabels = get(dictionary, valueKey);
    if (valueLabels) {
      let label = valueLabels[String(value)];
      if (!label && value === 0 && valueLabels.zero) {
        label = valueLabels.zero;
      }
      if (!label && value === 1 && valueLabels.one) {
        label = valueLabels.one;
      }
      if (label) {
        return `${deviceName} — ${label}`;
      }
    }
  }

  if (shouldFormatAsNumericValue(category, type)) {
    const formattedValue = formatNumericValue(value, unit, dictionary);
    if (formattedValue) {
      return `${deviceName} — ${formattedValue}`;
    }
  }

  const formattedValue = formatNumericValue(value, unit, dictionary);
  if (formattedValue && unit) {
    return `${deviceName} — ${formattedValue}`;
  }

  return `${deviceName}`;
};

const getActivitySource = (entry, dictionary) => {
  const categoryLabel = get(dictionary, `deviceFeatureCategory.${entry.device_feature_category}.shortCategoryName`);
  return categoryLabel || entry.device_feature_category;
};

const getEntryStyle = entry => {
  const { device_feature_category: category, value } = entry;
  const baseStyle = CATEGORY_STYLES[category] || DEFAULT_STYLE;
  const valueIcon = get(VALUE_ICON_OVERRIDES, `${category}.${value}`);
  return {
    ...baseStyle,
    icon: valueIcon || baseStyle.icon
  };
};

const convertGladysDateToISO8601 = gladysDate => {
  if (!gladysDate) {
    return gladysDate;
  }
  if (typeof gladysDate === 'string') {
    return gladysDate.replace(' ', 'T').replace(' ', '');
  }
  return gladysDate;
};

const formatEntryTimeShort = (createdAt, language) =>
  dayjs(createdAt)
    .locale(language)
    .format('HH:mm');

const formatEntryTime = (createdAt, language, dictionary) => {
  const date = dayjs(createdAt).locale(language);
  const time = formatEntryTimeShort(createdAt, language);
  const activityLog = dictionary.activityLog || {};

  if (date.isToday()) {
    const todayLabel = activityLog.todayPrefix || 'Today';
    return `${todayLabel}, ${time}`;
  }
  if (date.isYesterday()) {
    const yesterdayLabel = activityLog.yesterdayPrefix || 'Yesterday';
    return `${yesterdayLabel}, ${time}`;
  }
  return `${date.format('dddd D MMMM')}, ${time}`;
};

const getActivityValueLabel = (entry, dictionary) => {
  const title = getActivityTitle(entry, dictionary);
  const deviceName = entry.device_name;

  if (title === deviceName) {
    return '';
  }

  if (title.indexOf(`${deviceName} — `) === 0) {
    return title.slice(deviceName.length + 3);
  }

  if (title.indexOf(`${deviceName} `) === 0) {
    return title.slice(deviceName.length + 1);
  }

  return title;
};

const formatGroupTimeRange = (entries, language) => {
  if (entries.length === 0) {
    return '';
  }

  const newestTime = formatEntryTimeShort(entries[0].created_at, language);
  const oldestTime = formatEntryTimeShort(entries[entries.length - 1].created_at, language);

  if (newestTime === oldestTime) {
    return newestTime;
  }

  return `${oldestTime}–${newestTime}`;
};

const GROUP_MIN_SIZE = 2;

const groupConsecutiveEntries = (entries, minGroupSize = GROUP_MIN_SIZE) => {
  const items = [];
  let index = 0;

  while (index < entries.length) {
    const selector = entries[index].device_feature_selector;
    let nextIndex = index + 1;

    while (nextIndex < entries.length && entries[nextIndex].device_feature_selector === selector) {
      nextIndex += 1;
    }

    const run = entries.slice(index, nextIndex);

    if (run.length >= minGroupSize) {
      items.push({
        type: 'group',
        key: `${selector}-${run[0].created_at}`,
        entries: run
      });
    } else {
      run.forEach(entry => {
        items.push({
          type: 'single',
          key: `${entry.device_feature_selector}-${entry.created_at}`,
          entry
        });
      });
    }

    index = nextIndex;
  }

  return items;
};

const formatDayHeader = (createdAt, language, dictionary) => {
  const date = dayjs(createdAt).locale(language);
  const activityLog = dictionary.activityLog || {};

  if (date.isToday()) {
    return activityLog.todayPrefix || 'Today';
  }
  if (date.isYesterday()) {
    return activityLog.yesterdayPrefix || 'Yesterday';
  }
  return date.format('dddd D MMMM YYYY');
};

const groupEntriesByDay = (entries, language, dictionary) => {
  const groups = [];
  let currentKey = null;

  entries.forEach(entry => {
    const key = dayjs(entry.created_at)
      .locale(language)
      .format('YYYY-MM-DD');

    if (key !== currentKey) {
      currentKey = key;
      groups.push({
        key,
        label: formatDayHeader(entry.created_at, language, dictionary),
        entries: []
      });
    }
    groups[groups.length - 1].entries.push(entry);
  });

  return groups;
};

const formatDateInputValue = date => dayjs(date).format('YYYY-MM-DD');

const getCustomDateRangeISO = (customFrom, customTo) => {
  const fromDate = customFrom || formatDateInputValue(new Date());
  let toDate = customTo || fromDate;

  if (toDate < fromDate) {
    toDate = fromDate;
  }

  const from = dayjs(fromDate)
    .startOf('day')
    .toDate()
    .toISOString();
  const to = dayjs(toDate)
    .endOf('day')
    .toDate()
    .toISOString();

  return { from, to, fromDate, toDate };
};

const isCustomRangeIncludingToday = customTo => {
  if (!customTo) {
    return false;
  }

  return customTo >= formatDateInputValue(new Date());
};

const groupEntriesByDate = (entries, language) => {
  const groups = [];
  let currentGroup = null;

  entries.forEach(entry => {
    const date = new Date(entry.created_at);
    const dateKey = date.toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!currentGroup || currentGroup.dateKey !== dateKey) {
      currentGroup = { dateKey, entries: [] };
      groups.push(currentGroup);
    }
    currentGroup.entries.push(entry);
  });

  return groups;
};

export {
  getActivityTitle,
  getActivityValueLabel,
  getActivitySource,
  getEntryStyle,
  formatNumericValue,
  shouldFormatAsNumericValue,
  convertGladysDateToISO8601,
  formatEntryTime,
  formatEntryTimeShort,
  formatGroupTimeRange,
  formatDayHeader,
  formatDateInputValue,
  getCustomDateRangeISO,
  isCustomRangeIncludingToday,
  getCategoriesFromGroups,
  isCategoryInGroups,
  groupEntriesByDay,
  groupConsecutiveEntries,
  groupEntriesByDate,
  ACTIVITY_CATEGORY_GROUPS,
  CATEGORY_STYLES,
  GROUP_MIN_SIZE
};
