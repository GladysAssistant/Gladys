const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, ENERGY_CONTRACT_STATUS } = require('../../utils/constants');

/**
 * @description Scene trigger `energy-contract.price-changed` (spec 8.2): compare the current
 * unit price and tier label of every active contract with the last values observed for its
 * meter, and emit a trigger check for each meter whose price or label changed. The values are
 * kept per meter, not per contract: when a contract ends and its successor starts (a tariff
 * change), the successor's first price is compared with the last price of the previous one.
 * The first observation of a meter only records it, so a restart never fires the trigger. An
 * error on one contract is logged and does not stop the others.
 * @param {object} [options] - `calendar_granularity`: only check the contracts whose tariff reads
 * a calendar of this granularity (the quarter-hour check between two 30-minute jobs only needs
 * the contracts reading a 15-minute calendar: the others never change price at :15 / :45).
 * @returns {Promise<Array<object>>} The emitted trigger events.
 * @example
 * await checkPriceChanges();
 * await checkPriceChanges({ calendar_granularity: 'fifteen_minutes' });
 */
async function checkPriceChanges(options = {}) {
  const allContracts = await this.get();
  let contracts = allContracts;
  if (options.calendar_granularity !== undefined) {
    const calendars = await db.TariffCalendar.findAll({
      where: { granularity: options.calendar_granularity },
      attributes: ['key'],
    });
    const keys = new Set(calendars.map((calendar) => calendar.key));
    // a delegated contract without fixed fees stores a tariff without calendars
    contracts = allContracts.filter((contract) => (contract.tariff.calendars || []).some((key) => keys.has(key)));
  }
  const emitted = [];
  // Sequential on purpose: one meter read at a time on the store
  // eslint-disable-next-line no-restricted-syntax
  for (const contract of contracts) {
    if (contract.status === ENERGY_CONTRACT_STATUS.ACTIVE) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const current = await this.getCurrent(contract.selector);
        const price = current.price === undefined ? null : current.price;
        const label = current.label === undefined ? null : current.label;
        const meterDeviceId = contract.electric_meter_device_id;
        const previous = this.lastKnownPrices.get(meterDeviceId);
        this.lastKnownPrices.set(meterDeviceId, { price, label });
        if (previous && (previous.price !== price || previous.label !== label)) {
          const triggerEvent = {
            type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
            electric_meter: contract.electric_meter_device.selector,
            contract: contract.selector,
            // a trigger saved before the meter targeting names one of these contracts: it is
            // read as the meter of that contract, whichever of them is active now
            meter_contracts: allContracts
              .filter((meterContract) => meterContract.electric_meter_device_id === meterDeviceId)
              .map((meterContract) => meterContract.selector),
            price,
            previous_price: previous.price,
            label,
            previous_label: previous.label,
            currency: current.currency,
          };
          logger.info(
            `Energy contract ${contract.selector}: price changed from ${previous.price} (${previous.label}) to ${price} (${label})`,
          );
          this.event.emit(EVENTS.TRIGGERS.CHECK, triggerEvent);
          emitted.push(triggerEvent);
        }
      } catch (e) {
        logger.warn(`Energy contract ${contract.selector}: unable to check the current price: ${e.message}`);
      }
    }
  }
  return emitted;
}

module.exports = { checkPriceChanges };
