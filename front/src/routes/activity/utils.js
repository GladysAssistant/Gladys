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
  siren: { icon: 'bell', color: '#ef4444' },
  tamper: { icon: 'shield-off', color: '#ef4444' },
  'battery-low': { icon: 'battery', color: '#f59e0b' },
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

const getActivityTitle = (entry, dictionary) => {
  const { device_name: deviceName, device_feature_category: category, device_feature_type: type, value } = entry;

  const titleTemplate = get(
    dictionary,
    `activityLog.eventTitle.${category}.${type}.${String(value)}`
  );
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

  return `${deviceName}`;
};

const getActivitySource = (entry, dictionary) => {
  const categoryLabel = get(dictionary, `deviceFeatureCategory.${entry.device_feature_category}.shortCategoryName`);
  return categoryLabel || entry.device_feature_category;
};

const getEntryStyle = (entry) => {
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

const formatEntryTime = (createdAt, language, dictionary) => {
  const date = dayjs(createdAt).locale(language);
  const time = date.format('HH:mm');
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
    const key = dayjs(entry.created_at).locale(language).format('YYYY-MM-DD');

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
  getActivitySource,
  getEntryStyle,
  convertGladysDateToISO8601,
  formatEntryTime,
  formatDayHeader,
  groupEntriesByDay,
  groupEntriesByDate,
  CATEGORY_STYLES
};
