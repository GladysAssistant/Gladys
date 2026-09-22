const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const { SYSTEM_VARIABLE_NAMES, ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { validateContractTariff, isValidTimezone } = require('./contract.validate');
const { compileTariff } = require('./tariff.compile');
const { priceIntervals } = require('./tariff.priceIntervals');
const { THIRTY_MINUTES_MS } = require('./meter.intervals');

const MAX_PREVIEW_DAYS = 31;
const SAMPLE_INTERVALS = 48;
const SYNTHETIC_KWH = 0.5;

/**
 * @description Build a flat synthetic consumption profile for a window (0.5 kWh per
 * 30 minutes): what the preview shows when the meter has no stored consumption yet.
 * @param {Date} from - Window start.
 * @param {Date} to - Window end.
 * @returns {Array<object>} Intervals.
 * @example
 * buildSyntheticIntervals(new Date('2026-01-01'), new Date('2026-01-08'));
 */
function buildSyntheticIntervals(from, to) {
  const intervals = [];
  const start = Math.floor(from.getTime() / THIRTY_MINUTES_MS) * THIRTY_MINUTES_MS;
  for (let ms = start; ms < to.getTime(); ms += THIRTY_MINUTES_MS) {
    intervals.push({ starts_at: new Date(ms).toISOString(), kwh: SYNTHETIC_KWH });
  }
  return intervals;
}

/**
 * @description Sum the costs per component and in total.
 * @param {Array<object>} costs - Engine costs.
 * @returns {object} { total, components: { key: amount }, kwh }.
 * @example
 * sumCosts(costs);
 */
function sumCosts(costs) {
  const components = {};
  let total = 0;
  costs.forEach((cost) => {
    total += cost.cost;
    Object.keys(cost.components).forEach((key) => {
      components[key] = (components[key] || 0) + cost.components[key];
    });
  });
  const round = (v) => Math.round(v * 1e6) / 1e6;
  Object.keys(components).forEach((key) => {
    components[key] = round(components[key]);
  });
  return { total: round(total), components };
}

/**
 * @description Price the real intervals of a meter over a window with a tariff, without
 * writing anything (section 8.1, `POST /energy_contract/preview`): totals per component
 * and up to 48 sample intervals. A tiered tariff gets the real `cumulative_before`.
 * @param {object} params - { tariff, inputs, timezone, currency, from, to, electric_meter_device_id,
 * billing_period_start_day, pricing_mode }.
 * @returns {Promise<object>} { from, to, intervals, kwh, total, components, samples, warnings, synthetic }.
 * @example
 * await preview({ tariff, timezone: 'Europe/Paris', from: '2026-01-05', to: '2026-01-12' });
 */
async function preview(params) {
  if (params === null || typeof params !== 'object' || typeof params.tariff !== 'object' || params.tariff === null) {
    throw new BadParameters('tariff: is required');
  }
  const pricingMode = params.pricing_mode || ENERGY_CONTRACT_PRICING_MODES.RULES;
  if (pricingMode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED) {
    throw new BadParameters('pricing_mode: a delegated contract cannot be previewed, its integration prices it');
  }
  const timezone = params.timezone || (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  if (!isValidTimezone(timezone)) {
    throw new BadParameters(`timezone: "${timezone}" is not a known IANA timezone`);
  }
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new BadParameters('from: must be a date before to');
  }
  if (to.getTime() - from.getTime() > MAX_PREVIEW_DAYS * 24 * 60 * 60 * 1000) {
    throw new BadParameters(`to: the preview window is limited to ${MAX_PREVIEW_DAYS} days`);
  }
  const tariff = validateContractTariff(params.tariff, params.inputs, pricingMode);
  const contract = {
    timezone,
    billing_period_start_day: params.billing_period_start_day || 1,
    currency: params.currency,
  };
  const compiled = compileTariff(tariff);
  let intervals = [];
  let synthetic = false;
  if (params.electric_meter_device_id) {
    if (!this.stateManager.get('deviceById', params.electric_meter_device_id)) {
      throw new NotFoundError('ELECTRIC_METER_DEVICE_NOT_FOUND');
    }
    intervals = await this.getMeterIntervals(params.electric_meter_device_id, from, to);
  }
  if (intervals.length === 0) {
    intervals = buildSyntheticIntervals(from, to);
    synthetic = true;
  }
  const cumulativeBefore =
    compiled.hasTier && !synthetic
      ? await this.getMeterCumulative(
          params.electric_meter_device_id,
          contract,
          new Date(intervals[0].starts_at).getTime(),
        )
      : undefined;
  const fromMs = new Date(intervals[0].starts_at).getTime();
  const toMs = new Date(intervals[intervals.length - 1].starts_at).getTime();
  const calendars = await this.loadCalendarLookup(compiled.calendars, fromMs, toMs, timezone);
  const result = priceIntervals(compiled, contract, intervals, { calendars, cumulative_before: cumulativeBefore });
  const kwh = Math.round(intervals.reduce((sum, i) => sum + i.kwh, 0) * 1e6) / 1e6;
  const step = Math.max(1, Math.ceil(result.costs.length / SAMPLE_INTERVALS));
  const samples = result.costs
    .filter((cost, index) => index % step === 0)
    .map((cost, index) => ({
      ...cost,
      kwh: intervals[index * step].kwh,
      unit_price:
        intervals[index * step].kwh > 0 ? Math.round((cost.cost / intervals[index * step].kwh) * 1e6) / 1e6 : null,
    }));
  const warnings = {};
  result.warnings.forEach((warning) => {
    warnings[warning.reason] = (warnings[warning.reason] || 0) + 1;
  });
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    currency: params.currency || null,
    intervals: intervals.length,
    kwh,
    ...sumCosts(result.costs),
    samples,
    warnings,
    synthetic,
  };
}

module.exports = { preview, buildSyntheticIntervals, sumCosts };
