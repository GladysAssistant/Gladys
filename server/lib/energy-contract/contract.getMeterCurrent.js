const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description The meter a price widget or a price scene targets (spec 8.1 and 8.2): the meter
 * named by its device selector, else the meter of a contract (a widget or a scene saved before
 * the meter targeting stores a contract selector: it is read as the meter of that contract),
 * else the main meter.
 * @param {object} [target] - `electric_meter` (device selector) or `energy_contract` (contract selector).
 * @returns {Promise<object|null>} The meter `{ id, selector, name }`, null when there is no main meter.
 * @example
 * await resolveElectricMeter({ electric_meter: 'linky' });
 * await resolveElectricMeter({ energy_contract: 'edf-tempo-9-kva' });
 * await resolveElectricMeter();
 */
async function resolveElectricMeter(target = {}) {
  let meterDeviceId;
  if (target.electric_meter) {
    const device = this.stateManager.get('device', target.electric_meter);
    if (!device) {
      throw new NotFoundError('ELECTRIC_METER_NOT_FOUND');
    }
    meterDeviceId = device.id;
  } else if (target.energy_contract) {
    // NotFoundError when the contract no longer exists
    const contract = await this.getBySelector(target.energy_contract);
    meterDeviceId = contract.electric_meter_device_id;
  } else {
    meterDeviceId = await this.getMainElectricMeterDeviceId();
    if (!meterDeviceId) {
      return null;
    }
  }
  const meter = this.stateManager.get('deviceById', meterDeviceId);
  return {
    id: meterDeviceId,
    selector: meter ? meter.selector : null,
    name: meter ? meter.name : null,
  };
}

/**
 * @description Current price of a meter (spec 8.1, `GET /energy_contract/current`): the price of
 * the meter's contract active at the instant, computed by `getCurrent`. A meter without an active
 * contract at that instant (before its first contract, between two contracts, after the last one),
 * or no meter at all, answers `contract: null` and `price: null`: never the price of an expired
 * or a scheduled contract.
 * @param {object} [target] - `electric_meter` (device selector), or `energy_contract` (contract
 * selector, read as its meter); the main meter when neither is given.
 * @param {object} [options] - `at` (instant, now by default), passed to `getCurrent`.
 * @returns {Promise<object>} The answer of `getCurrent` with `electric_meter`, or
 * `{ electric_meter, contract: null, price: null }`.
 * @example
 * await getMeterCurrent({ electric_meter: 'linky' });
 */
async function getMeterCurrent(target = {}, options = {}) {
  const at = options.at === undefined ? Date.now() : new Date(options.at).getTime();
  const electricMeter = await this.resolveElectricMeter(target);
  const contract = electricMeter ? await this.getActiveAt(electricMeter.id, at) : null;
  if (!contract) {
    return { electric_meter: electricMeter, contract: null, price: null };
  }
  const current = await this.getCurrent(contract.selector, options);
  return { ...current, electric_meter: electricMeter };
}

module.exports = { resolveElectricMeter, getMeterCurrent };
