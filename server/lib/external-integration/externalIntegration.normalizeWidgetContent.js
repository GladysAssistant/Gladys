const logger = require('../../utils/logger');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const {
  MAX_WIDGET_CONTENT_BYTES,
  SUPPORTED_WIDGET_CONTENT_VERSION,
  WIDGET_CONTENT_TTL_MIN_SECONDS,
  WIDGET_CONTENT_TTL_MAX_SECONDS,
  WIDGET_CONTENT_TTL_DEFAULT_SECONDS,
  WIDGET_COLORS,
  WIDGET_ICON_REGEX,
  WIDGET_TEXT_VARIANTS,
  WIDGET_CHART_TYPES,
  WIDGET_CHART_INTERVALS,
  WIDGET_CARD_LIST_DISPLAYS,
  WIDGET_IMAGE_FITS,
  WIDGET_IMAGE_KEY_REGEX,
  WIDGET_BUTTON_STYLES,
  WIDGET_ACTION_KEY_REGEX,
  MAX_WIDGET_ACTION_PARAMS_BYTES,
  MAX_WIDGET_URL_LENGTH,
  WIDGET_CONTENT_BUDGET,
} = require('./constants');

// The content vocabulary of the integration dashboard widgets
// (capabilities/dashboard-widgets.md, sections 4 and 5). The payload comes
// from unaudited code: every component type and field is whitelisted, every
// string is bounded, every number finite, every date parsed, every link
// https. A component missing a required field is dropped — never the whole
// content — and the content budget then trims what a card cannot hold.
const INVALID_CONTENT_ERROR = 'EXTERNAL_INTEGRATION_INVALID_WIDGET_CONTENT';

// Per-field text bounds, in characters per language value.
const TEXT_BOUNDS = {
  heading: 40,
  caption: 80,
  body: 300,
  tileValue: 12,
  tileLabel: 24,
  unit: 6,
  statusLabel: 40,
  statusValue: 40,
  seriesName: 24,
  chartTitle: 40,
  cardTitle: 60,
  cardSubtitle: 60,
  badgeText: 16,
  cardDescription: 2000,
  linkLabel: 24,
  imageAlt: 100,
  buttonLabel: 24,
};
const MAX_STATUS_ITEMS = 10;
const MAX_CHART_SERIES = 4;
const MAX_CHART_POINTS = 300;
const MAX_CHART_DEVICE_FEATURES = 4;
const MAX_CARD_LIST_ITEMS = { grid: 12, list: 8 };
const MAX_CARD_LINKS = 3;
const DEFAULT_CHART_INTERVAL = 'last-day';
const ELLIPSIS = '…';
const LANGUAGE_KEY_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;
// control characters other than the line feed (kept in multi-line texts)
// and the tab (turned into a space)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const FOCAL_TYPES = ['chart', 'card-list', 'image'];
const TILE_TYPES = ['value', 'gauge'];

/**
 * @description True for a plain object (not null, not an array).
 * @param {any} value - The value to test.
 * @returns {boolean} True for a plain object.
 * @example
 * isPlainObject({});
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @description Normalize one string of a text field: control characters
 * stripped, line breaks removed (single-line) or blank-line runs collapsed
 * (multi-line), trimmed, truncated to its bound with an ellipsis.
 * @param {string} text - The raw string.
 * @param {number} maxLength - The bound in characters.
 * @param {object} options - Options.
 * @param {boolean} options.multiline - True to keep line breaks.
 * @returns {string|null} The normalized string, null when empty.
 * @example
 * normalizeString('  Hello\nworld  ', 40, { multiline: false });
 */
function normalizeString(text, maxLength, { multiline }) {
  let normalized = text.replace(CONTROL_CHARS_REGEX, '').replace(/\r\n?/g, '\n');
  if (multiline) {
    // at most one blank line in a row: line breaks are the formatting, a
    // layout drawn with blank lines is not
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
  } else {
    normalized = normalized.replace(/[\n\t]+/g, ' ');
  }
  normalized = normalized.trim();
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length > maxLength) {
    normalized = `${normalized.slice(0, Math.max(maxLength - 1, 0))}${ELLIPSIS}`;
  }
  return normalized;
}

/**
 * @description Normalize a text field: a plain string or a multi-language
 * object (`en` required, the C.1 language fallback rule). Every value is
 * bounded; a multi-language object without a usable `en` is dropped.
 * @param {any} value - The raw text field.
 * @param {number} maxLength - The bound in characters per language value.
 * @param {object} [options] - Options.
 * @param {boolean} [options.multiline] - True to keep line breaks.
 * @returns {string|object|null} The normalized text, null when unusable.
 * @example
 * normalizeText({ en: 'Battery', fr: 'Batterie' }, 24);
 */
function normalizeText(value, maxLength, { multiline = false } = {}) {
  if (typeof value === 'string') {
    return normalizeString(value, maxLength, { multiline });
  }
  if (!isPlainObject(value)) {
    return null;
  }
  const normalized = {};
  Object.keys(value).forEach((language) => {
    if (!LANGUAGE_KEY_REGEX.test(language) || typeof value[language] !== 'string') {
      return;
    }
    const text = normalizeString(value[language], maxLength, { multiline });
    if (text !== null) {
      normalized[language] = text;
    }
  });
  if (normalized.en === undefined) {
    return null;
  }
  return normalized;
}

/**
 * @description Keep a finite number, drop anything else.
 * @param {any} value - The raw value.
 * @returns {number|null} The number, or null.
 * @example
 * toFiniteNumber(12.5);
 */
function toFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * @description Parse an ISO 8601 date string, returned re-serialized as ISO
 * (the frontend formats it in the user's locale and timezone).
 * @param {any} value - The raw value.
 * @returns {string|null} The ISO date, or null when invalid.
 * @example
 * toIsoDate('2026-10-07');
 */
function toIsoDate(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * @description Keep an https URL within the length bound.
 * @param {any} value - The raw value.
 * @returns {string|null} The URL, or null.
 * @example
 * toHttpsUrl('https://www.themoviedb.org/movie/1');
 */
function toHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_WIDGET_URL_LENGTH || !value.startsWith('https://')) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? value : null;
  } catch (e) {
    return null;
  }
}

/**
 * @description Keep a value belonging to an enum.
 * @param {any} value - The raw value.
 * @param {Array<string>} allowedValues - The enum.
 * @param {string} [defaultValue] - Value when absent or unknown.
 * @returns {string|undefined} The value, the default, or undefined.
 * @example
 * toEnum('success', WIDGET_COLORS);
 */
function toEnum(value, allowedValues, defaultValue) {
  return allowedValues.includes(value) ? value : defaultValue;
}

/**
 * @description Keep a Feather icon name (shape only: an unknown name renders
 * no icon on the frontend, never an error).
 * @param {any} value - The raw value.
 * @returns {string|undefined} The icon name, or undefined.
 * @example
 * toIcon('battery');
 */
function toIcon(value) {
  return typeof value === 'string' && WIDGET_ICON_REGEX.test(value) ? value : undefined;
}

/**
 * @description Keep an image key of the content (section 6 of the spec).
 * @param {any} value - The raw value.
 * @returns {string|undefined} The key, or undefined.
 * @example
 * toImageKey('poster-20637522');
 */
function toImageKey(value) {
  return typeof value === 'string' && WIDGET_IMAGE_KEY_REGEX.test(value) ? value : undefined;
}

/**
 * @description Keep a device feature reference: the feature's external_id as
 * a plain string, exactly as the integration published it. Any other shape
 * (object, number) is a hard error for the component carrying it.
 * @param {any} value - The raw value.
 * @returns {string|null} The external_id, or null.
 * @example
 * toDeviceReference('ext:ext-roborock:s7:battery');
 */
function toDeviceReference(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * @description Copy the optional fields shared by several components.
 * @param {object} raw - The raw component.
 * @param {object} component - The normalized component.
 * @param {object} fields - Which fields to copy: { label, unit, icon, color }.
 * @example
 * copyCommonFields(raw, component, { label: 24, unit: 6, icon: true, color: true });
 */
function copyCommonFields(raw, component, fields) {
  if (fields.label) {
    const label = normalizeText(raw.label, fields.label);
    if (label !== null) {
      component.label = label;
    }
  }
  if (fields.unit) {
    const unit = normalizeText(raw.unit, fields.unit);
    if (unit !== null) {
      component.unit = unit;
    }
  }
  if (fields.icon) {
    const icon = toIcon(raw.icon);
    if (icon !== undefined) {
      component.icon = icon;
    }
  }
  if (fields.color) {
    const color = toEnum(raw.color, WIDGET_COLORS);
    if (color !== undefined) {
      component.color = color;
    }
  }
}

/**
 * @description Normalize a `text` component.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeTextComponent({ type: 'text', variant: 'caption', text: 'Next 30 days' });
 */
function normalizeTextComponent(raw) {
  const variant = toEnum(raw.variant, WIDGET_TEXT_VARIANTS, 'body');
  const text = normalizeText(raw.text, TEXT_BOUNDS[variant], { multiline: variant === 'body' });
  if (text === null) {
    return null;
  }
  return { type: 'text', variant, text };
}

/**
 * @description Normalize a `value` component (a tile): an inline value, or
 * a live device feature reference in its place.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeValueComponent({ type: 'value', value: 82, unit: '%', label: 'Battery' });
 */
function normalizeValueComponent(raw) {
  const component = { type: 'value' };
  if (raw.device_feature !== undefined) {
    const reference = toDeviceReference(raw.device_feature);
    if (reference === null) {
      return null;
    }
    component.device_feature = reference;
    copyCommonFields(raw, component, { label: TEXT_BOUNDS.tileLabel, icon: true, color: true });
    return component;
  }
  const number = toFiniteNumber(raw.value);
  const text = number === null ? normalizeText(raw.value, TEXT_BOUNDS.tileValue) : null;
  if (number === null && text === null) {
    return null;
  }
  component.value = number === null ? text : number;
  copyCommonFields(raw, component, {
    label: TEXT_BOUNDS.tileLabel,
    unit: TEXT_BOUNDS.unit,
    icon: true,
    color: true,
  });
  return component;
}

/**
 * @description Normalize a `gauge` component: an inline value with its
 * range, or a live device feature reference (range defaulting to the
 * feature's).
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeGaugeComponent({ type: 'gauge', value: 42, min: 0, max: 100 });
 */
function normalizeGaugeComponent(raw) {
  const component = { type: 'gauge' };
  const min = toFiniteNumber(raw.min);
  const max = toFiniteNumber(raw.max);
  const hasValidRange = min !== null && max !== null && min < max;
  if (raw.device_feature !== undefined) {
    const reference = toDeviceReference(raw.device_feature);
    if (reference === null) {
      return null;
    }
    component.device_feature = reference;
    if (hasValidRange) {
      component.min = min;
      component.max = max;
    }
    copyCommonFields(raw, component, { label: TEXT_BOUNDS.tileLabel, color: true });
    return component;
  }
  const value = toFiniteNumber(raw.value);
  if (value === null || !hasValidRange) {
    return null;
  }
  component.value = value;
  component.min = min;
  component.max = max;
  copyCommonFields(raw, component, { label: TEXT_BOUNDS.tileLabel, unit: TEXT_BOUNDS.unit, color: true });
  return component;
}

/**
 * @description Normalize a `status` component: a bounded list of
 * label / value rows.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeStatusComponent({ type: 'status', items: [{ label: 'State', value: 'Docked' }] });
 */
function normalizeStatusComponent(raw) {
  if (!Array.isArray(raw.items)) {
    return null;
  }
  const items = [];
  raw.items.forEach((rawItem) => {
    if (items.length >= MAX_STATUS_ITEMS || !isPlainObject(rawItem)) {
      return;
    }
    const label = normalizeText(rawItem.label, TEXT_BOUNDS.statusLabel);
    const number = toFiniteNumber(rawItem.value);
    const text = number === null ? normalizeText(rawItem.value, TEXT_BOUNDS.statusValue) : null;
    if (label === null || (number === null && text === null)) {
      return;
    }
    const item = { label, value: number === null ? text : number };
    copyCommonFields(rawItem, item, { icon: true, color: true });
    items.push(item);
  });
  if (items.length === 0) {
    return null;
  }
  return { type: 'status', items };
}

/**
 * @description Normalize one inline series of a `chart` component.
 * @param {object} rawSeries - The raw series.
 * @returns {object|null} The normalized series, or null to drop it.
 * @example
 * normalizeChartSeries({ name: 'Forecast', points: [{ t: '2026-09-18T10:00:00Z', v: 1.2 }] });
 */
function normalizeChartSeries(rawSeries) {
  if (!isPlainObject(rawSeries) || !Array.isArray(rawSeries.points)) {
    return null;
  }
  const points = [];
  rawSeries.points.forEach((rawPoint) => {
    if (points.length >= MAX_CHART_POINTS || !isPlainObject(rawPoint)) {
      return;
    }
    const t = toIsoDate(rawPoint.t);
    const v = toFiniteNumber(rawPoint.v);
    if (t === null || v === null) {
      return;
    }
    points.push({ t, v });
  });
  if (points.length === 0) {
    return null;
  }
  const series = { points };
  const name = normalizeText(rawSeries.name, TEXT_BOUNDS.seriesName);
  if (name !== null) {
    series.name = name;
  }
  return series;
}

/**
 * @description Normalize a `chart` component: inline series, or live device
 * feature references with an interval of the chart box.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeChartComponent({ type: 'chart', device_features: ['ext:solar:power'], interval: 'last-day' });
 */
function normalizeChartComponent(raw) {
  const component = { type: 'chart', chart_type: toEnum(raw.chart_type, WIDGET_CHART_TYPES, 'line') };
  if (raw.device_features !== undefined) {
    if (!Array.isArray(raw.device_features) || raw.device_features.length === 0) {
      return null;
    }
    const references = raw.device_features.slice(0, MAX_CHART_DEVICE_FEATURES).map(toDeviceReference);
    if (references.some((reference) => reference === null)) {
      return null;
    }
    component.device_features = references;
    component.interval = toEnum(raw.interval, WIDGET_CHART_INTERVALS, DEFAULT_CHART_INTERVAL);
  } else {
    if (!Array.isArray(raw.series)) {
      return null;
    }
    const series = raw.series
      .slice(0, MAX_CHART_SERIES)
      .map(normalizeChartSeries)
      .filter((oneSeries) => oneSeries !== null);
    if (series.length === 0) {
      return null;
    }
    component.series = series;
  }
  const title = normalizeText(raw.title, TEXT_BOUNDS.chartTitle);
  if (title !== null) {
    component.title = title;
  }
  copyCommonFields(raw, component, { unit: TEXT_BOUNDS.unit });
  return component;
}

/**
 * @description Normalize one item of a `card-list` component.
 * @param {object} rawItem - The raw item.
 * @returns {object|null} The normalized item, or null to drop it.
 * @example
 * normalizeCardListItem({ title: "L'Odyssée", date: '2026-10-07', image: 'poster-1' });
 */
function normalizeCardListItem(rawItem) {
  if (!isPlainObject(rawItem)) {
    return null;
  }
  const title = normalizeText(rawItem.title, TEXT_BOUNDS.cardTitle);
  if (title === null) {
    return null;
  }
  const item = { title };
  const subtitle = normalizeText(rawItem.subtitle, TEXT_BOUNDS.cardSubtitle);
  if (subtitle !== null) {
    item.subtitle = subtitle;
  }
  const date = toIsoDate(rawItem.date);
  if (date !== null) {
    item.date = date;
  }
  const image = toImageKey(rawItem.image);
  if (image !== undefined) {
    item.image = image;
  }
  if (isPlainObject(rawItem.badge)) {
    const badgeText = normalizeText(rawItem.badge.text, TEXT_BOUNDS.badgeText);
    if (badgeText !== null) {
      item.badge = { text: badgeText };
      copyCommonFields(rawItem.badge, item.badge, { color: true });
    }
  }
  const description = normalizeText(rawItem.description, TEXT_BOUNDS.cardDescription, { multiline: true });
  if (description !== null) {
    item.description = description;
  }
  if (Array.isArray(rawItem.links)) {
    const links = [];
    rawItem.links.forEach((rawLink) => {
      if (links.length >= MAX_CARD_LINKS || !isPlainObject(rawLink)) {
        return;
      }
      const url = toHttpsUrl(rawLink.url);
      if (url === null) {
        return;
      }
      const link = { url };
      const label = normalizeText(rawLink.label, TEXT_BOUNDS.linkLabel);
      if (label !== null) {
        link.label = label;
      }
      links.push(link);
    });
    if (links.length > 0) {
      item.links = links;
    }
  }
  return item;
}

/**
 * @description Normalize a `card-list` component: a poster grid or a row
 * list, bounded by its display.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeCardListComponent({ type: 'card-list', display: 'grid', items: [{ title: 'Movie' }] });
 */
function normalizeCardListComponent(raw) {
  if (!Array.isArray(raw.items)) {
    return null;
  }
  const display = toEnum(raw.display, WIDGET_CARD_LIST_DISPLAYS, 'list');
  const items = [];
  raw.items.forEach((rawItem) => {
    if (items.length >= MAX_CARD_LIST_ITEMS[display]) {
      return;
    }
    const item = normalizeCardListItem(rawItem);
    if (item !== null) {
      items.push(item);
    }
  });
  if (items.length === 0) {
    return null;
  }
  return { type: 'card-list', display, items };
}

/**
 * @description Normalize an `image` component: a declared image key in a
 * fixed frame.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeImageComponent({ type: 'image', key: 'cleaning-map-3f9a2c' });
 */
function normalizeImageComponent(raw) {
  const key = toImageKey(raw.key);
  if (key === undefined) {
    return null;
  }
  const component = { type: 'image', key, fit: toEnum(raw.fit, WIDGET_IMAGE_FITS, 'cover') };
  const alt = normalizeText(raw.alt, TEXT_BOUNDS.imageAlt);
  if (alt !== null) {
    component.alt = alt;
  }
  return component;
}

/**
 * @description Normalize a `button` component: exactly one of a widget
 * action, a device feature command or a link.
 * @param {object} raw - The raw component.
 * @returns {object|null} The normalized component, or null to drop it.
 * @example
 * normalizeButtonComponent({ type: 'button', label: 'Start', action: { key: 'start' } });
 */
function normalizeButtonComponent(raw) {
  const label = normalizeText(raw.label, TEXT_BOUNDS.buttonLabel);
  if (label === null) {
    return null;
  }
  const kinds = ['action', 'device_feature', 'link'].filter((kind) => raw[kind] !== undefined);
  if (kinds.length !== 1) {
    return null;
  }
  const component = { type: 'button', label, style: toEnum(raw.style, WIDGET_BUTTON_STYLES, 'secondary') };
  const icon = toIcon(raw.icon);
  if (icon !== undefined) {
    component.icon = icon;
  }
  const [kind] = kinds;
  if (kind === 'action') {
    if (
      !isPlainObject(raw.action) ||
      typeof raw.action.key !== 'string' ||
      !WIDGET_ACTION_KEY_REGEX.test(raw.action.key)
    ) {
      return null;
    }
    const params = isPlainObject(raw.action.params) ? raw.action.params : {};
    if (JSON.stringify(params).length > MAX_WIDGET_ACTION_PARAMS_BYTES) {
      return null;
    }
    component.action = { key: raw.action.key, params, confirm: raw.action.confirm === true };
    return component;
  }
  if (kind === 'device_feature') {
    const reference = toDeviceReference(raw.device_feature);
    const value = toFiniteNumber(raw.value);
    if (reference === null || value === null) {
      return null;
    }
    component.device_feature = reference;
    component.value = value;
    return component;
  }
  const url = isPlainObject(raw.link) ? toHttpsUrl(raw.link.url) : null;
  if (url === null) {
    return null;
  }
  component.link = { url };
  return component;
}

const COMPONENT_NORMALIZERS = {
  text: normalizeTextComponent,
  value: normalizeValueComponent,
  gauge: normalizeGaugeComponent,
  status: normalizeStatusComponent,
  chart: normalizeChartComponent,
  'card-list': normalizeCardListComponent,
  image: normalizeImageComponent,
  button: normalizeButtonComponent,
};

/**
 * @description Apply the content budget (section 5): components beyond a
 * cap are dropped in content order with a warning — the first ones win, the
 * integration puts what matters first. Duplicate action keys are dropped
 * too (the action route allowlists by key).
 * @param {Array} components - The per-component normalized list.
 * @param {string} context - Where the content comes from, for the logs.
 * @returns {Array} The components that fit the budget, in content order.
 * @example
 * applyContentBudget(components, 'ext-tmdb/upcoming_releases');
 */
function applyContentBudget(components, context) {
  const counters = { components: 0, focal: 0, tiles: 0, texts: 0, bodyTexts: 0, status: 0, buttons: 0 };
  const seenActionKeys = new Set();
  const drop = (component, reason) => {
    logger.warn(`Widget content ${context}: dropping ${component.type} component (${reason})`);
    return false;
  };
  return components.filter((component) => {
    if (counters.components >= WIDGET_CONTENT_BUDGET.components) {
      return drop(component, `more than ${WIDGET_CONTENT_BUDGET.components} components`);
    }
    if (FOCAL_TYPES.includes(component.type)) {
      if (counters.focal >= WIDGET_CONTENT_BUDGET.focal) {
        return drop(component, 'a second focal component');
      }
      counters.focal += 1;
    } else if (TILE_TYPES.includes(component.type)) {
      if (counters.tiles >= WIDGET_CONTENT_BUDGET.tiles) {
        return drop(component, `more than ${WIDGET_CONTENT_BUDGET.tiles} tiles`);
      }
      counters.tiles += 1;
    } else if (component.type === 'text') {
      if (counters.texts >= WIDGET_CONTENT_BUDGET.texts) {
        return drop(component, `more than ${WIDGET_CONTENT_BUDGET.texts} texts`);
      }
      if (component.variant === 'body') {
        if (counters.bodyTexts >= WIDGET_CONTENT_BUDGET.bodyTexts) {
          return drop(component, 'a second body text');
        }
        counters.bodyTexts += 1;
      }
      counters.texts += 1;
    } else if (component.type === 'status') {
      if (counters.status >= WIDGET_CONTENT_BUDGET.status) {
        return drop(component, 'a second status list');
      }
      counters.status += 1;
    } else if (component.type === 'button') {
      if (counters.buttons >= WIDGET_CONTENT_BUDGET.buttons) {
        return drop(component, `more than ${WIDGET_CONTENT_BUDGET.buttons} buttons`);
      }
      if (component.action) {
        if (seenActionKeys.has(component.action.key)) {
          return drop(component, `duplicate action key "${component.action.key}"`);
        }
        seenActionKeys.add(component.action.key);
      }
      counters.buttons += 1;
    }
    counters.components += 1;
    return true;
  });
}

/**
 * @description Normalize and bound the content returned by an integration
 * over widget.get (sections 4 and 5 of capabilities/dashboard-widgets.md).
 * Whitelist per component type, unknown types and fields dropped, bounded
 * strings, finite numbers, validated dates, https links, semantic enums,
 * then the content budget. A content that is not an object, exceeds the raw
 * size bound or has no components array fails like a timeout; a content
 * `version` above the supported one fails with the dedicated code so the
 * widget can say "this widget needs a newer Gladys".
 * @param {object} payload - The `data.content` of the command-result.
 * @param {string} [context] - Where the content comes from, for the logs.
 * @returns {object} { version, ttl_seconds, components } — components in content order.
 * @example
 * const content = normalizeWidgetContent({ version: 1, components: [{ type: 'text', text: 'Hello' }] });
 */
function normalizeWidgetContent(payload, context = 'widget') {
  if (!isPlainObject(payload)) {
    throw new ExternalIntegrationUnavailableError(INVALID_CONTENT_ERROR);
  }
  if (JSON.stringify(payload).length > MAX_WIDGET_CONTENT_BYTES) {
    throw new ExternalIntegrationUnavailableError(INVALID_CONTENT_ERROR);
  }
  const version = payload.version === undefined ? 1 : payload.version;
  if (!Number.isInteger(version) || version < 1) {
    throw new ExternalIntegrationUnavailableError(INVALID_CONTENT_ERROR);
  }
  if (version > SUPPORTED_WIDGET_CONTENT_VERSION) {
    throw new ExternalIntegrationUnavailableError(ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED);
  }
  if (!Array.isArray(payload.components)) {
    throw new ExternalIntegrationUnavailableError(INVALID_CONTENT_ERROR);
  }
  const rawTtl = toFiniteNumber(payload.ttl_seconds);
  const ttlSeconds =
    rawTtl === null
      ? WIDGET_CONTENT_TTL_DEFAULT_SECONDS
      : Math.min(WIDGET_CONTENT_TTL_MAX_SECONDS, Math.max(WIDGET_CONTENT_TTL_MIN_SECONDS, Math.round(rawTtl)));
  const components = [];
  payload.components.forEach((rawComponent) => {
    if (!isPlainObject(rawComponent)) {
      logger.warn(`Widget content ${context}: dropping a component that is not an object`);
      return;
    }
    const normalize = COMPONENT_NORMALIZERS[rawComponent.type];
    if (!normalize) {
      // forward compatibility: a newer integration on an older core renders
      // partially rather than not at all
      logger.warn(`Widget content ${context}: dropping component of unknown type "${rawComponent.type}"`);
      return;
    }
    const component = normalize(rawComponent);
    if (component === null) {
      logger.warn(`Widget content ${context}: dropping ${rawComponent.type} component (missing or invalid field)`);
      return;
    }
    components.push(component);
  });
  return {
    version,
    ttl_seconds: ttlSeconds,
    components: applyContentBudget(components, context),
  };
}

/**
 * @description Collect the image keys declared in a normalized content
 * (the `image` component and the `card-list` item images): the allowlist of
 * the image route (section 6).
 * @param {Array} components - The normalized components.
 * @returns {Array<string>} The declared image keys, deduplicated.
 * @example
 * const keys = collectImageKeys(content.components);
 */
function collectImageKeys(components) {
  const keys = new Set();
  components.forEach((component) => {
    if (component.type === 'image') {
      keys.add(component.key);
    } else if (component.type === 'card-list') {
      component.items.forEach((item) => {
        if (item.image) {
          keys.add(item.image);
        }
      });
    }
  });
  return [...keys];
}

/**
 * @description Find the widget action declared under a key in a normalized
 * content: the allowlist of the action route (section 7).
 * @param {Array} components - The normalized components.
 * @param {string} actionKey - The action key.
 * @returns {object|null} The `action` object of the button, or null.
 * @example
 * const action = findWidgetAction(content.components, 'start');
 */
function findWidgetAction(components, actionKey) {
  const button = components.find(
    (component) => component.type === 'button' && component.action && component.action.key === actionKey,
  );
  return button ? button.action : null;
}

module.exports = {
  normalizeWidgetContent,
  applyContentBudget,
  collectImageKeys,
  findWidgetAction,
  INVALID_CONTENT_ERROR,
};
