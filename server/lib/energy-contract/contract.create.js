const { Op } = require('sequelize');
const db = require('../../models');
const { ConflictError, NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, SYSTEM_VARIABLE_NAMES, ENERGY_CONTRACT_DIRECTIONS } = require('../../utils/constants');
const { validateContract, validateContractTariff } = require('./contract.validate');
const { localToUtcMs } = require('./tariff.time');
const logger = require('../../utils/logger');

/**
 * @description Reject a contract whose validity overlaps another contract of the same
 * meter and direction (a meter has one active contract per date, successive contracts
 * model a change of contract).
 * @param {object} contract - Contract fields (electric_meter_device_id, direction, valid_from, valid_to).
 * @param {string} [excludeId] - Contract id to ignore (the one being updated).
 * @returns {Promise<void>} Throws ConflictError on overlap.
 * @example
 * await assertNoOverlap({ electric_meter_device_id: '…', direction: 'consumption', valid_from: '2026-01-01' });
 */
async function assertNoOverlap(contract, excludeId) {
  const where = {
    electric_meter_device_id: contract.electric_meter_device_id,
    direction: contract.direction,
    // other.valid_from <= this.valid_to (or this is open-ended)
    ...(contract.valid_to ? { valid_from: { [Op.lte]: contract.valid_to } } : {}),
    // other.valid_to >= this.valid_from or other is open-ended
    [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: contract.valid_from } }],
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const other = await db.EnergyContract.findOne({ where, attributes: ['id', 'name', 'valid_from', 'valid_to'] });
  if (other) {
    throw new ConflictError(
      `Contract "${other.name}" already covers this meter from ${other.valid_from} to ${other.valid_to || 'today'}`,
    );
  }
}

/**
 * @description Ask the energy-monitoring service to recompute the costs of a meter
 * from a date (a contract was created, changed or deleted).
 * @param {object} contract - The contract.
 * @param {string} fromDate - Local date `YYYY-MM-DD` to recompute from.
 * @example
 * this.requestRecalculation(contract, '2026-01-01');
 */
function requestRecalculation(contract, fromDate) {
  const from = new Date(localToUtcMs(fromDate, contract.timezone));
  logger.info(`Energy contract ${contract.selector}: requesting cost recalculation from ${from.toISOString()}`);
  this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, {
    from,
    electric_meter_device_ids: [contract.electric_meter_device_id],
  });
}

/**
 * @description Create a contract: validates the payload and the tariff (in its pricing mode),
 * refuses a date overlap on the same meter, defaults the timezone to the system one, and
 * asks for a cost recalculation from `valid_from`.
 * @param {object} data - Contract payload (section 4 of the spec).
 * @returns {Promise<object>} The created contract with its status.
 * @example
 * await create({ name: 'EDF Base', electric_meter_device_id: '…', valid_from: '2026-01-01', currency: 'EUR', tariff });
 */
async function create(data) {
  const value = validateContract(data);
  const meter = this.stateManager.get('deviceById', value.electric_meter_device_id);
  if (!meter) {
    throw new NotFoundError('ELECTRIC_METER_DEVICE_NOT_FOUND');
  }
  const timezone = value.timezone || (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  const contract = {
    ...value,
    timezone,
    direction: value.direction || ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION,
    valid_to: value.valid_to || null,
    pricing_mode: value.pricing_mode || 'rules',
  };
  contract.tariff = validateContractTariff(contract.tariff, contract.inputs, contract.pricing_mode);
  await assertNoOverlap(contract);
  const row = await db.EnergyContract.create(contract);
  const created = await this.getBySelector(row.selector);
  this.requestRecalculation(created, created.valid_from);
  return created;
}

module.exports = { create, assertNoOverlap, requestRecalculation };
