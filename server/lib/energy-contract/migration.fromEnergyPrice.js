const db = require('../../models');
const logger = require('../../utils/logger');
const { NotFoundError } = require('../../utils/coreErrors');
const { buildUniqueSelector } = require('../../utils/addSelector');
const {
  SYSTEM_VARIABLE_NAMES,
  ENERGY_CONTRACT_PROVIDER_KINDS,
  ENERGY_CONTRACT_PRICING_MODES,
  ENERGY_CONTRACT_TYPES,
  EVENTS,
} = require('../../utils/constants');
const { convertPriceRows, normalizeContractType } = require('./legacy/convertPriceRows');
const { legacyCost } = require('./legacy/calculateCost');
const { compileTariff } = require('./tariff.compile');
const { priceIntervals } = require('./tariff.priceIntervals');
const { localToUtcMs } = require('./tariff.time');
const { TEMPO_CALENDAR_KEY } = require('./templates/internal');

const MIGRATION_DONE_VARIABLE = 'ENERGY_CONTRACT_MIGRATION_DONE';
// the recalculation the migration asks for, picked up by the energy-monitoring service at
// its start: the migration runs before the services listen to the recalculation event
const PENDING_RECALCULATION_VARIABLE = 'ENERGY_CONTRACT_PENDING_RECALCULATION';
const VERIFICATION_DAYS = 7;
const MAX_GAP_RATIO = 0.005;
const CURRENCY_MAP = { euro: 'EUR', dollar: 'USD', pound: 'GBP', franc: 'CHF', yen: 'JPY' };

/**
 * @description Map a legacy free currency value to an ISO 4217 code.
 * @param {string} currency - Legacy value (`euro`, `dollar`, `EUR`…).
 * @returns {string} ISO code.
 * @example
 * toIsoCurrency('euro'); // 'EUR'
 */
function toIsoCurrency(currency) {
  const value = String(currency || 'EUR').trim();
  const mapped = CURRENCY_MAP[value.toLowerCase()];
  if (mapped) {
    return mapped;
  }
  if (/^[A-Za-z]{3}$/.test(value)) {
    return value.toUpperCase();
  }
  logger.warn(`Energy contract migration: unknown currency "${value}" converted to EUR, edit the contract`);
  return 'EUR';
}

/**
 * @description Group legacy rows into contracts (section 9.1): one contract per
 * (meter, contract name, contract type, subscribed power, start date).
 * @param {Array<object>} rows - t_energy_price rows.
 * @returns {Array<object>} Groups: { key, rows }.
 * @example
 * groupPriceRows(rows);
 */
function groupPriceRows(rows) {
  const groups = new Map();
  rows
    .filter((row) => row.electric_meter_device_id)
    .forEach((row) => {
      const key = [
        row.electric_meter_device_id,
        row.contract_name || '',
        normalizeContractType(row.contract),
        row.subscribed_power || '',
        row.start_date,
      ].join('|');
      if (!groups.has(key)) {
        groups.set(key, { key, rows: [] });
      }
      groups.get(key).rows.push(row);
    });
  return Array.from(groups.values());
}

/**
 * @description Compare the legacy and the engine calculation of a migrated contract
 * over the last 7 days of stored consumption (section 9.3). Returns a warning object
 * when the gap exceeds 0.5%, null otherwise.
 * @param {object} contract - The created contract (plain).
 * @param {Array<object>} rows - Its legacy rows.
 * @param {string} systemTimezone - System timezone.
 * @returns {Promise<object|null>} The warning or null.
 * @example
 * await this.verifyMigratedContract(contract, rows, 'Europe/Paris');
 */
async function verifyMigratedContract(contract, rows, systemTimezone) {
  const to = new Date();
  const from = new Date(to.getTime() - VERIFICATION_DAYS * 24 * 60 * 60 * 1000);
  const intervals = await this.getMeterIntervals(contract.electric_meter_device_id, from, to);
  if (intervals.length === 0) {
    return null;
  }
  const compiled = compileTariff(contract.tariff, contract.inputs || {});
  const calendars = await this.loadCalendarLookup(
    compiled.calendars,
    new Date(intervals[0].starts_at).getTime(),
    to.getTime(),
    contract.timezone,
  );
  const engine = priceIntervals(compiled, contract, intervals, { calendars });
  const tempoDayMap = new Map();
  if (compiled.calendars.includes(TEMPO_CALENDAR_KEY)) {
    try {
      const entries = await this.getCalendarEntries(TEMPO_CALENDAR_KEY, { from, to });
      entries.forEach((entry) => {
        const date = new Date(entry.starts_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
        tempoDayMap.set(date, entry.value);
      });
    } catch (e) {
      // the tempo calendar is declared by the edf-tempo service, which starts after the
      // migration: without it the legacy code cannot price a Tempo day, nothing to compare
      if (!(e instanceof NotFoundError)) {
        throw e;
      }
      logger.debug(`Energy contract migration: tempo calendar not declared yet, verification skipped`);
      return null;
    }
  }
  const perDay = new Map();
  let legacyTotal = 0;
  let engineTotal = 0;
  intervals.forEach((interval, index) => {
    const legacy = legacyCost(rows, new Date(interval.starts_at), interval.kwh, systemTimezone, tempoDayMap);
    if (legacy === null) {
      return;
    }
    // the engine stores the subscription in the states, the legacy code did not
    const energy = engine.costs[index].components.energy || 0;
    legacyTotal += legacy;
    engineTotal += energy;
    const day = interval.starts_at.slice(0, 10);
    const entry = perDay.get(day) || { day, legacy: 0, engine: 0 };
    entry.legacy += legacy;
    entry.engine += energy;
    perDay.set(day, entry);
  });
  if (legacyTotal === 0) {
    return null;
  }
  const gap = Math.abs(engineTotal - legacyTotal) / legacyTotal;
  if (gap <= MAX_GAP_RATIO) {
    return null;
  }
  const warning = {
    gap_ratio: Math.round(gap * 10000) / 10000,
    legacy_total: Math.round(legacyTotal * 1e4) / 1e4,
    engine_total: Math.round(engineTotal * 1e4) / 1e4,
    days: Array.from(perDay.values()).map((d) => ({
      day: d.day,
      legacy: Math.round(d.legacy * 1e4) / 1e4,
      engine: Math.round(d.engine * 1e4) / 1e4,
    })),
  };
  logger.warn(
    `Energy contract "${contract.name}": migrated calculation differs by ${(gap * 100).toFixed(
      2,
    )}% over the last ${VERIFICATION_DAYS} days`,
  );
  return warning;
}

/**
 * @description Convert every group of t_energy_price rows into a contract (sections 9.1 to 9.3),
 * once: a system variable marks the migration as done. The price rows are left untouched
 * (read-only compatibility window). Every meter then gets one full cost recalculation so
 * its stored costs carry the subscription like the new contracts do.
 * @returns {Promise<Array<object>>} The created contracts.
 * @example
 * await migrateFromEnergyPrice();
 */
async function migrateFromEnergyPrice() {
  const done = await this.variable.getValue(MIGRATION_DONE_VARIABLE);
  if (done) {
    return [];
  }
  const rows = (await db.EnergyPrice.findAll({ order: [['start_date', 'ASC']] })).map((r) => r.get({ plain: true }));
  const systemTimezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  const groups = groupPriceRows(rows);
  const created = [];
  const newlyCreated = [];
  const catalogueKeys = new Set();
  try {
    (await this.getCommunityTemplates()).forEach((t) => catalogueKeys.add(t.key));
  } catch (e) {
    logger.debug(`Energy contract migration: catalogue unavailable (${e.message}), provider set to user`);
  }
  let failures = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const group of groups) {
    const first = group.rows[0];
    const contractType = normalizeContractType(first.contract);
    const { tariff } = convertPriceRows(group.rows);
    const endDates = group.rows.map((r) => r.end_date).filter(Boolean);
    const hasOpenEnd = group.rows.some((r) => !r.end_date);
    const name =
      first.contract_name || `${contractType}${first.subscribed_power ? ` ${first.subscribed_power} kVA` : ''}`;
    const templateKey = first.contract_name && catalogueKeys.has(first.contract_name) ? first.contract_name : null;
    const contract = {
      name,
      electric_meter_device_id: first.electric_meter_device_id,
      valid_from: first.start_date,
      valid_to: hasOpenEnd || endDates.length === 0 ? null : endDates.sort().pop(),
      currency: toIsoCurrency(first.currency),
      timezone: contractType === ENERGY_CONTRACT_TYPES.EDF_TEMPO ? 'Europe/Paris' : systemTimezone,
      billing_period_start_day: 1,
      subscribed_power: first.subscribed_power ? Number(first.subscribed_power) || null : null,
      power_unit: first.subscribed_power ? 'kVA' : null,
      provider_kind: templateKey ? ENERGY_CONTRACT_PROVIDER_KINDS.COMMUNITY : ENERGY_CONTRACT_PROVIDER_KINDS.USER,
      template_key: templateKey,
      pricing_mode: ENERGY_CONTRACT_PRICING_MODES.RULES,
      tariff,
      inputs: null,
    };
    let row;
    try {
      // a previous attempt failed on another group: the groups already converted are kept
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.EnergyContract.findOne({
        where: { electric_meter_device_id: contract.electric_meter_device_id, valid_from: contract.valid_from, name },
      });
      if (existing) {
        created.push(existing.get({ plain: true }));
        // eslint-disable-next-line no-continue
        continue;
      }
      // several validity periods of one contract share its name: unique selectors
      // eslint-disable-next-line no-await-in-loop
      contract.selector = await buildUniqueSelector(db.EnergyContract, name);
      // eslint-disable-next-line no-await-in-loop
      row = await db.EnergyContract.create(contract);
    } catch (e) {
      failures += 1;
      logger.error(`Energy contract migration: unable to convert "${name}": ${e.message}`);
      // eslint-disable-next-line no-continue
      continue;
    }
    const plain = row.get({ plain: true });
    created.push(plain);
    newlyCreated.push(plain);
    logger.info(`Energy contract migration: "${name}" created from ${group.rows.length} price row(s)`);
    // the verification never leaves a created contract outside the success path
    try {
      // eslint-disable-next-line no-await-in-loop
      const warning = await this.verifyMigratedContract(plain, group.rows, systemTimezone);
      if (warning) {
        // eslint-disable-next-line no-await-in-loop
        await row.update({ migration_warning: warning });
      }
    } catch (e) {
      logger.warn(`Energy contract migration: unable to verify "${name}": ${e.message}`);
    }
  }
  // only the contracts created by this run need a recalculation: a retry after a failed
  // group must not recompute the meters converted by a previous start again
  const meterIds = Array.from(new Set(newlyCreated.map((c) => c.electric_meter_device_id)));
  if (meterIds.length > 0) {
    // the earliest start of the created contracts, each in its own timezone
    const earliestMs = Math.min(...newlyCreated.map((c) => localToUtcMs(c.valid_from, c.timezone)));
    const payload = {
      from: new Date(earliestMs).toISOString(),
      electric_meter_device_ids: meterIds,
    };
    // stored before the done marker for the energy-monitoring service, which is not
    // listening yet at this point of the boot and clears it once the recalculation
    // succeeded; the event still serves a migration run while the service is up
    await this.variable.setValue(PENDING_RECALCULATION_VARIABLE, JSON.stringify(payload));
    this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, { ...payload, from: new Date(payload.from) });
  }
  if (failures === 0) {
    await this.variable.setValue(MIGRATION_DONE_VARIABLE, new Date().toISOString());
  } else {
    logger.warn(`Energy contract migration: ${failures} group(s) not converted, retried at the next start`);
  }
  return created;
}

/**
 * @description The recalculation left by the migration for the energy-monitoring service
 * (section 9.3). It stays stored until `clearPendingRecalculation` is called after a
 * successful run, so a failed or interrupted recalculation is retried at the next start.
 * @returns {Promise<object|null>} { from, electric_meter_device_ids } or null.
 * @example
 * const pending = await energyContract.getPendingRecalculation();
 */
async function getPendingRecalculation() {
  const raw = await this.variable.getValue(PENDING_RECALCULATION_VARIABLE);
  if (!raw) {
    return null;
  }
  try {
    const payload = JSON.parse(raw);
    return { ...payload, from: new Date(payload.from) };
  } catch (e) {
    logger.warn(`Energy contract migration: invalid pending recalculation dropped (${e.message})`);
    await this.variable.destroy(PENDING_RECALCULATION_VARIABLE);
    return null;
  }
}

/**
 * @description Clear the pending recalculation once it ran successfully.
 * @returns {Promise<void>} Resolves when cleared.
 * @example
 * await energyContract.clearPendingRecalculation();
 */
async function clearPendingRecalculation() {
  await this.variable.destroy(PENDING_RECALCULATION_VARIABLE);
}

module.exports = {
  migrateFromEnergyPrice,
  getPendingRecalculation,
  clearPendingRecalculation,
  PENDING_RECALCULATION_VARIABLE,
  verifyMigratedContract,
  groupPriceRows,
  toIsoCurrency,
  MIGRATION_DONE_VARIABLE,
};
