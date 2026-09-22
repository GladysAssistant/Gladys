// Tariff definition grammar (docs/specs/energy-contracts.md, sections 3 and 4).
// Every enumerated value here is mirrored in tariff.schema.json, the JSON Schema
// the ecosystem validates against; test/lib/energy-contract/tariff.schema.test.js
// keeps the two in sync.

const TARIFF_VERSION = 1;

const TARIFF_COMPONENT_KINDS = {
  CONSUMPTION: 'consumption',
  FIXED: 'fixed',
  TAX: 'tax',
  DEMAND: 'demand',
};

const TARIFF_FIXED_PERIODS = {
  DAY: 'day',
  MONTH: 'month',
};

const TARIFF_CUMULATIVE_SCOPES = {
  DAY: 'day',
  MONTH: 'month',
  BILLING_PERIOD: 'billing_period',
};

const TARIFF_DEMAND_PERIODS = {
  MONTH: 'month',
  BILLING_PERIOD: 'billing_period',
};

const TARIFF_DEMAND_AGGREGATIONS = {
  MAX: 'max',
  TOP3_AVERAGE: 'top3_average',
};

// ISO order: the compiled form maps them onto the JavaScript convention (0 = Sunday).
const TARIFF_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const CALENDAR_GRANULARITIES = {
  DAY: 'day',
  THIRTY_MINUTES: 'thirty_minutes',
};

const CALENDAR_KEY_REGEX = /^[a-z0-9][a-z0-9-]{0,63}$/;
const COMPONENT_KEY_REGEX = /^[a-z0-9][a-z0-9_-]{0,31}$/;
// "24:00" is accepted as the end of an interval, never "24:xx"
const TIME_REGEX = /^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/;
// the start of an interval is never "24:00"
const TIME_START_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const MONTH_DAY_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const INPUT_PLACEHOLDER_REGEX = /\{\{input:([a-z0-9_]+)\}\}/g;

const TARIFF_LIMITS = {
  MAX_COMPONENTS: 16,
  MAX_RULES_PER_COMPONENT: 64,
  MAX_CALENDARS: 8,
  MAX_TIME_INTERVALS: 24,
  MAX_CALENDAR_VALUES: 32,
  MAX_LABEL_LENGTH: 64,
};

const DEFAULT_INTERVAL_DURATION_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;
const COST_DECIMALS = 6;

const CALENDAR_WARNING_REASONS = {
  CALENDAR_MISSING: 'calendar_missing',
  NO_PRICE: 'no_price',
};

module.exports = {
  TARIFF_VERSION,
  TARIFF_COMPONENT_KINDS,
  TARIFF_FIXED_PERIODS,
  TARIFF_CUMULATIVE_SCOPES,
  TARIFF_DEMAND_PERIODS,
  TARIFF_DEMAND_AGGREGATIONS,
  TARIFF_WEEKDAYS,
  CALENDAR_GRANULARITIES,
  CALENDAR_KEY_REGEX,
  COMPONENT_KEY_REGEX,
  TIME_REGEX,
  TIME_START_REGEX,
  MONTH_DAY_REGEX,
  DATE_REGEX,
  INPUT_PLACEHOLDER_REGEX,
  TARIFF_LIMITS,
  DEFAULT_INTERVAL_DURATION_MINUTES,
  MINUTES_PER_DAY,
  COST_DECIMALS,
  CALENDAR_WARNING_REASONS,
};
