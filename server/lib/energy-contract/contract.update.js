const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { validateContract, validateContractTariff } = require('./contract.validate');
const { assertNoOverlap } = require('./contract.create');

// A change of one of these fields changes the computed costs (section 8.1):
// the costs are recomputed from the earliest valid_from involved. The `inputs` are not one of
// them: the stored tariff is already substituted, a new tariff comes with its own change.
const RECALCULATION_FIELDS = ['tariff', 'valid_from', 'valid_to', 'timezone', 'billing_period_start_day'];

/**
 * @description Update a contract by selector. The tariff is re-validated in the contract's
 * pricing mode, an overlap is refused, and a change of tariff, dates or meter triggers a cost
 * recalculation from the contract's (old and new) valid_from (of the old and new meters).
 * @param {string} selector - Contract selector.
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} The updated contract with its status.
 * @example
 * await update('edf-base', { valid_to: '2026-06-30' });
 */
async function update(selector, data) {
  const row = await db.EnergyContract.findOne({ where: { selector } });
  if (row === null) {
    throw new NotFoundError('ENERGY_CONTRACT_NOT_FOUND');
  }
  const value = validateContract(data, { partial: true });
  // clone: without it Sequelize returns the live dataValues, updated by row.update below
  const before = row.get({ plain: true, clone: true });
  const next = {
    ...before,
    ...value,
    valid_to: value.valid_to === undefined ? before.valid_to : value.valid_to || null,
  };
  // a partial update is checked against the stored dates too
  if (next.valid_to !== null && next.valid_to < next.valid_from) {
    throw new BadParameters('valid_to: must be on or after valid_from');
  }
  next.tariff = validateContractTariff(next.tariff, next.inputs, next.pricing_mode, next);
  await assertNoOverlap(next, before.id);
  // the meter of a consumption contract is a root, priced by it (energy-hierarchy.md, section C.2)
  await this.detachElectricMeter(next);
  const { id, selector: keptSelector, created_at: createdAt, updated_at: updatedAt, ...fields } = next;
  await row.update(fields);
  const updated = await this.getBySelector(selector);
  const changed = RECALCULATION_FIELDS.some((key) => JSON.stringify(before[key]) !== JSON.stringify(updated[key]));
  // a contract moved to another meter: the new meter (and what hangs under it) is priced by this
  // contract from now on, the former one is no longer
  const meterChanged = before.electric_meter_device_id !== updated.electric_meter_device_id;
  if (changed || meterChanged) {
    this.requestRecalculation(
      updated,
      before.valid_from < updated.valid_from ? before.valid_from : updated.valid_from,
      meterChanged ? [before.electric_meter_device_id, updated.electric_meter_device_id] : undefined,
    );
  }
  return updated;
}

module.exports = { update };
