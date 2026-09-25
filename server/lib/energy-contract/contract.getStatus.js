const { ENERGY_CONTRACT_STATUS, ENERGY_CONTRACT_PRICING_MODES } = require('../../utils/constants');
const { getLocalContext } = require('./tariff.time');

/**
 * @description Compute the display status of a contract at a date (section 8.1 of the spec):
 * `orphaned` when a delegated contract lost its integration, else `scheduled`, `active` or `expired`
 * by comparing the local date of the contract's timezone with its validity.
 * @param {object} contract - The contract (plain object).
 * @param {number|Date} [at] - Instant, now by default.
 * @returns {string} The status.
 * @example
 * getStatus(contract); // 'active'
 */
function getStatus(contract, at = Date.now()) {
  if (contract.pricing_mode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED && !contract.provider_service_id) {
    return ENERGY_CONTRACT_STATUS.ORPHANED;
  }
  const { date } = getLocalContext(new Date(at).getTime(), contract.timezone);
  if (date < contract.valid_from) {
    return ENERGY_CONTRACT_STATUS.SCHEDULED;
  }
  if (contract.valid_to && date > contract.valid_to) {
    return ENERGY_CONTRACT_STATUS.EXPIRED;
  }
  return ENERGY_CONTRACT_STATUS.ACTIVE;
}

module.exports = { getStatus };
