const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { validateContract, validateContractTariff } = require('./contract.validate');
const { assertNoOverlap } = require('./contract.create');

// A change of one of these fields changes the computed costs (section 8.1):
// the costs are recomputed from the earliest valid_from involved.
const RECALCULATION_FIELDS = ['tariff', 'inputs', 'valid_from', 'valid_to', 'timezone', 'billing_period_start_day'];

/**
 * @description Update a contract by selector. The tariff is re-validated in the contract's
 * pricing mode, an overlap is refused, and a change of tariff or dates triggers a cost
 * recalculation from the contract's (old and new) valid_from.
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
  next.tariff = validateContractTariff(next.tariff, next.inputs, next.pricing_mode);
  await assertNoOverlap(next, before.id);
  const { id, selector: keptSelector, created_at: createdAt, updated_at: updatedAt, ...fields } = next;
  await row.update(fields);
  const updated = await this.getBySelector(selector);
  const changed = RECALCULATION_FIELDS.some((key) => JSON.stringify(before[key]) !== JSON.stringify(updated[key]));
  if (changed) {
    this.requestRecalculation(updated, before.valid_from < updated.valid_from ? before.valid_from : updated.valid_from);
  }
  return updated;
}

module.exports = { update };
