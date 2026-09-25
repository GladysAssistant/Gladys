const Joi = require('joi');
const { BadParameters } = require('../../utils/coreErrors');
const {
  ENERGY_CONTRACT_PROVIDER_KINDS_LIST,
  ENERGY_CONTRACT_PRICING_MODES,
  ENERGY_CONTRACT_PRICING_MODES_LIST,
  ENERGY_CONTRACT_ENERGY_TYPES_LIST,
  ENERGY_CONTRACT_DIRECTIONS_LIST,
  ENERGY_CONTRACT_POWER_UNITS_LIST,
} = require('../../utils/constants');
const { validateTariff } = require('./tariff.validate');
const { substituteInputs } = require('./tariff.compile');
const { TARIFF_COMPONENT_KINDS, DATE_REGEX } = require('./tariff.constants');

const MAX_INPUT_KEYS = 32;

const contractSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(128),
  electric_meter_device_id: Joi.string().guid(),
  energy_type: Joi.string().valid(...ENERGY_CONTRACT_ENERGY_TYPES_LIST),
  direction: Joi.string().valid(...ENERGY_CONTRACT_DIRECTIONS_LIST),
  valid_from: Joi.string().pattern(DATE_REGEX),
  valid_to: Joi.string()
    .pattern(DATE_REGEX)
    .allow(null, ''),
  currency: Joi.string().pattern(/^[A-Z]{3}$/),
  timezone: Joi.string().max(64),
  billing_period_start_day: Joi.number()
    .integer()
    .min(1)
    .max(31),
  subscribed_power: Joi.number()
    .min(0)
    .allow(null),
  power_unit: Joi.string()
    .valid(...ENERGY_CONTRACT_POWER_UNITS_LIST)
    .allow(null),
  provider_kind: Joi.string().valid(...ENERGY_CONTRACT_PROVIDER_KINDS_LIST),
  provider_service_id: Joi.string()
    .guid()
    .allow(null),
  template_key: Joi.string()
    .max(64)
    .allow(null),
  template_version: Joi.string()
    .max(64)
    .allow(null),
  pricing_mode: Joi.string().valid(...ENERGY_CONTRACT_PRICING_MODES_LIST),
  tariff: Joi.object(),
  inputs: Joi.object()
    .pattern(/^[a-z0-9_-]{1,64}$/, Joi.any())
    .max(MAX_INPUT_KEYS)
    .allow(null),
});

const requiredOnCreate = ['name', 'electric_meter_device_id', 'valid_from', 'currency'];
// a delegated contract may carry no tariff at all (the integration prices everything)
const EMPTY_TARIFF = { tariff_version: 1, components: [] };

/**
 * @description Check that a timezone name is known to the runtime.
 * @param {string} timezone - IANA timezone.
 * @returns {boolean} True when the runtime can format dates in it.
 * @example
 * isValidTimezone('Europe/Paris'); // true
 */
function isValidTimezone(timezone) {
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @description Validate the tariff of a contract according to its pricing mode: the
 * full grammar in `rules` mode, only `fixed` components in `delegated` mode (the
 * integration prices the energy, the core adds the subscription at display time).
 * @param {object} tariff - Tariff definition.
 * @param {object} inputs - Template inputs to substitute.
 * @param {string} pricingMode - `rules` or `delegated`.
 * @returns {object} The normalized tariff (inputs substituted).
 * @example
 * validateContractTariff({ tariff_version: 1, components: [] }, {}, 'delegated');
 */
function validateContractTariff(tariff, inputs, pricingMode) {
  const delegated = pricingMode === ENERGY_CONTRACT_PRICING_MODES.DELEGATED;
  if (tariff === undefined || tariff === null) {
    if (!delegated) {
      throw new BadParameters('tariff: is required');
    }
    return { ...EMPTY_TARIFF };
  }
  const substituted = substituteInputs(tariff, inputs || {});
  const components = Array.isArray(substituted.components) ? substituted.components : [];
  if (delegated) {
    const other = components.find((c) => c && c.kind !== TARIFF_COMPONENT_KINDS.FIXED);
    if (other) {
      throw new BadParameters(
        `tariff.components: a delegated contract only carries fixed components (found "${other.kind}")`,
      );
    }
  } else if (components.length === 0) {
    throw new BadParameters('tariff.components: at least one component is required in rules mode');
  }
  return validateTariff(substituted);
}

/**
 * @description Validate a contract payload (creation or update). Throws BadParameters
 * with a readable message; returns the payload with the normalized tariff.
 * @param {object} data - Contract payload.
 * @param {object} [options] - Options: `partial` (update: no required fields).
 * @returns {object} The validated payload.
 * @example
 * validateContract({ name: 'EDF Base', electric_meter_device_id: '…', valid_from: '2026-01-01', tariff });
 */
function validateContract(data, options = {}) {
  const { error, value } = contractSchema.validate(data, { abortEarly: true, convert: false });
  if (error) {
    const [detail] = error.details;
    throw new BadParameters(`${detail.path.join('.')}: ${detail.message.replace(/^"[^"]*" /, '')}`);
  }
  if (!options.partial) {
    const missing = requiredOnCreate.find((key) => value[key] === undefined);
    if (missing) {
      throw new BadParameters(`${missing}: is required`);
    }
  }
  if (value.timezone !== undefined && !isValidTimezone(value.timezone)) {
    throw new BadParameters(`timezone: "${value.timezone}" is not a known IANA timezone`);
  }
  if (value.valid_from !== undefined && value.valid_to && value.valid_to < value.valid_from) {
    throw new BadParameters('valid_to: must be on or after valid_from');
  }
  return value;
}

module.exports = {
  validateContract,
  validateContractTariff,
  isValidTimezone,
};
