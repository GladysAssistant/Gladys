const db = require('../../models');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { ExternalIntegrationUnavailableError, BadParameters } = require('../../utils/coreErrors');
const {
  ENERGY_CONTRACT_PRICE_TIMEOUT_MS,
  ENERGY_CONTRACT_CURRENT_TIMEOUT_MS,
  MAX_ENERGY_INTERVALS_PER_REQUEST,
} = require('./constants');
const { normalizeEnergyCosts, normalizeEnergyCurrent } = require('./externalIntegration.normalizeEnergyCosts');

/**
 * @description The service row of the integration providing a delegated contract.
 * @param {object} contract - The contract (provider_service_id).
 * @returns {Promise<object>} The service.
 * @example
 * await this.getEnergyContractProvider(contract);
 */
async function getEnergyContractProvider(contract) {
  if (!contract.provider_service_id) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_ENERGY_CONTRACT_ORPHANED');
  }
  const service = await db.Service.findByPk(contract.provider_service_id);
  if (service === null) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_ENERGY_CONTRACT_ORPHANED');
  }
  return service.get({ plain: true });
}

/**
 * @description The contract fields sent to the integration: identity and parameters,
 * never the meter nor the consumption history.
 * @param {object} contract - The contract.
 * @returns {object} The payload part.
 * @example
 * contractPayload(contract);
 */
function contractPayload(contract) {
  return {
    id: contract.id,
    template_key: contract.template_key,
    inputs: contract.inputs || {},
    currency: contract.currency,
    timezone: contract.timezone,
    billing_period_start_day: contract.billing_period_start_day || 1,
  };
}

/**
 * @description Delegated pricing (capabilities/energy-contracts.md, section 3): send the
 * intervals of one billing period to the integration over `energy-contract.price` and
 * normalize its answer. An invalid payload or a timeout throws: the caller leaves the
 * intervals without a cost and retries on the next run.
 * @param {object} contract - The contract (plain).
 * @param {object} request - { billing_period, cumulative_before, intervals }.
 * @returns {Promise<Map<string, object>>} starts_at → { cost, components, label }.
 * @example
 * await gladys.externalIntegration.priceEnergyContract(contract, { billing_period, cumulative_before, intervals });
 */
async function priceEnergyContract(contract, request) {
  if (!Array.isArray(request.intervals) || request.intervals.length === 0) {
    throw new BadParameters('intervals: must be a non-empty array');
  }
  if (request.intervals.length > MAX_ENERGY_INTERVALS_PER_REQUEST) {
    throw new BadParameters(`intervals: at most ${MAX_ENERGY_INTERVALS_PER_REQUEST} intervals per request`);
  }
  const service = await this.getEnergyContractProvider(contract);
  const result = await this.sendCommand(
    service,
    WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ENERGY_CONTRACT_PRICE,
    {
      contract: contractPayload(contract),
      billing_period: request.billing_period,
      cumulative_before: request.cumulative_before,
      intervals: request.intervals,
    },
    { timeoutMs: ENERGY_CONTRACT_PRICE_TIMEOUT_MS },
  );
  return normalizeEnergyCosts(result && result.data, request.intervals);
}

/**
 * @description Current price of a delegated contract: `energy-contract.current` with the
 * same state (billing period, accumulations, last peak), 5s ack deadline.
 * @param {object} contract - The contract (plain).
 * @param {object} request - { billing_period, cumulative, max_power_kw }.
 * @returns {Promise<object>} { price, unit, label, valid_until, next_price, next_label }.
 * @example
 * await gladys.externalIntegration.getEnergyContractCurrent(contract, { billing_period, cumulative, max_power_kw: 2 });
 */
async function getEnergyContractCurrent(contract, request) {
  const service = await this.getEnergyContractProvider(contract);
  const result = await this.sendCommand(
    service,
    WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ENERGY_CONTRACT_CURRENT,
    {
      contract: contractPayload(contract),
      billing_period: request.billing_period,
      cumulative: request.cumulative,
      max_power_kw: request.max_power_kw,
    },
    { timeoutMs: ENERGY_CONTRACT_CURRENT_TIMEOUT_MS },
  );
  return normalizeEnergyCurrent(result && result.data);
}

module.exports = { priceEnergyContract, getEnergyContractCurrent, getEnergyContractProvider, contractPayload };
