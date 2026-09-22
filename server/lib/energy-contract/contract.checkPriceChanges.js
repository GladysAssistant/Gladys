const logger = require('../../utils/logger');
const { EVENTS, ENERGY_CONTRACT_STATUS } = require('../../utils/constants');

/**
 * @description Scene trigger `energy-contract.price-changed` (spec 8.2): compare the current
 * unit price and tier label of every active contract with the last values observed, and
 * emit a trigger check for each contract whose price or label changed. The first observation
 * of a contract only records it, so a restart never fires the trigger. An error on one
 * contract is logged and does not stop the others.
 * @returns {Promise<Array<object>>} The emitted trigger events.
 * @example
 * await checkPriceChanges();
 */
async function checkPriceChanges() {
  const contracts = await this.get();
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
        const previous = this.lastKnownPrices.get(contract.id);
        this.lastKnownPrices.set(contract.id, { price, label });
        if (previous && (previous.price !== price || previous.label !== label)) {
          const triggerEvent = {
            type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
            contract: contract.selector,
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
