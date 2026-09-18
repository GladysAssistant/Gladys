import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { getLocalizedText } from '../../../routes/integration/all/external-integration/utils';

dayjs.extend(localizedFormat);

// The five canonical slots of an integration widget card (spec section 5),
// imposed by the core whatever the order of the content: header texts,
// tiles, the focal component, the status list (preceded by the body text),
// the buttons. Within a slot the content order is preserved.
export const splitIntoSlots = components => {
  const slots = { header: [], tiles: [], focal: null, body: null, status: null, buttons: [] };
  (components || []).forEach(component => {
    switch (component.type) {
      case 'text':
        if (component.variant === 'body') {
          slots.body = component;
        } else {
          slots.header.push(component);
        }
        break;
      case 'value':
      case 'gauge':
        slots.tiles.push(component);
        break;
      case 'chart':
      case 'card-list':
      case 'image':
        slots.focal = component;
        break;
      case 'status':
        slots.status = component;
        break;
      case 'button':
        slots.buttons.push(component);
        break;
      default:
        break;
    }
  });
  return slots;
};

// A text field of the content: a plain string or a multi-language object
export const text = (value, language) => getLocalizedText(value, language);

// Numbers follow the account language (digits and separators), at most two
// decimals: the integration sends raw values, the core formats
export const formatNumber = (value, language) => {
  if (typeof value !== 'number') {
    return value === undefined || value === null ? '' : `${value}`;
  }
  try {
    return new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(value);
  } catch (e) {
    return `${Math.round(value * 100) / 100}`;
  }
};

// ISO dates are formatted in the user's locale; a midnight UTC date (the
// "2026-10-07" of a release) shows as a day, anything else as a day and time
export const formatDate = (value, language) => {
  if (!value) {
    return '';
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return '';
  }
  const isMidnightUtc = /T00:00:00(\.000)?Z$/.test(value);
  return date.locale(language).format(isMidnightUtc ? 'll' : 'lll');
};

// The chart box interval enum, in minutes (the span the history route needs)
export const CHART_INTERVAL_MINUTES = {
  'last-hour': 60,
  'last-twelve-hours': 12 * 60,
  'last-day': 24 * 60,
  'last-three-days': 3 * 24 * 60,
  'last-week': 7 * 24 * 60,
  'last-month': 30 * 24 * 60,
  'last-three-months': 3 * 30 * 24 * 60,
  'last-year': 365 * 24 * 60
};

// Every device feature selector a content binds to (tiles, buttons, charts)
export const collectFeatureSelectors = components => {
  const selectors = new Set();
  (components || []).forEach(component => {
    if (component.device_feature_selector) {
      selectors.add(component.device_feature_selector);
    }
    (component.device_feature_selectors || []).forEach(selector => selectors.add(selector));
  });
  return [...selectors];
};

// Domain of an https URL, displayed next to a link label: unmoderated
// third-party content, the user sees where they click
export const getUrlDomain = url => (url || '').split('/')[2] || '';
