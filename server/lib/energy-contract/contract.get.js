const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { getStatus } = require('./contract.getStatus');

/**
 * @description Turn a contract row into its API shape: plain object with its status.
 * @param {object} row - Sequelize row.
 * @returns {object} The contract.
 * @example
 * toPlain(row);
 */
function toPlain(row) {
  const contract = row.get({ plain: true });
  contract.status = getStatus(contract);
  if (contract.provider_service) {
    contract.provider_service = {
      id: contract.provider_service.id,
      name: contract.provider_service.name,
      selector: contract.provider_service.selector,
      status: contract.provider_service.status,
    };
  }
  return contract;
}

const providerInclude = {
  model: db.Service,
  as: 'provider_service',
  attributes: ['id', 'name', 'selector', 'status'],
};

/**
 * @description List the contracts, most recent first.
 * @param {object} [options] - Filters: `electric_meter_device_id`, `provider_service_id`, `template_key`.
 * @returns {Promise<Array<object>>} The contracts with their status.
 * @example
 * await get({ electric_meter_device_id: '…' });
 */
async function get(options = {}) {
  const where = {};
  ['electric_meter_device_id', 'provider_service_id', 'template_key', 'pricing_mode'].forEach((key) => {
    if (options[key] !== undefined) {
      where[key] = options[key];
    }
  });
  const rows = await db.EnergyContract.findAll({
    where,
    include: [providerInclude],
    order: [
      ['valid_from', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });
  return rows.map(toPlain);
}

/**
 * @description Get one contract by selector.
 * @param {string} selector - Contract selector.
 * @returns {Promise<object>} The contract with its status.
 * @example
 * await getBySelector('edf-tempo-9-kva');
 */
async function getBySelector(selector) {
  const row = await db.EnergyContract.findOne({ where: { selector }, include: [providerInclude] });
  if (row === null) {
    throw new NotFoundError('ENERGY_CONTRACT_NOT_FOUND');
  }
  return toPlain(row);
}

/**
 * @description Find the contract of a meter active at a local date (section 7: the
 * interval is priced by the active contract of its root meter at the interval start).
 * @param {string} electricMeterDeviceId - Root meter device id.
 * @param {string} date - Local date `YYYY-MM-DD` (in the contract timezone).
 * @param {string} [direction] - `consumption` by default.
 * @returns {Promise<object|null>} The contract or null.
 * @example
 * await getActive('…', '2026-01-12');
 */
async function getActive(electricMeterDeviceId, date, direction = 'consumption') {
  const rows = await db.EnergyContract.findAll({
    where: { electric_meter_device_id: electricMeterDeviceId, direction },
    order: [['valid_from', 'DESC']],
  });
  const row = rows.find((r) => r.valid_from <= date && (r.valid_to === null || r.valid_to >= date));
  return row ? row.get({ plain: true }) : null;
}

module.exports = { get, getBySelector, getActive, toPlain };
