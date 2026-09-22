// Validation of the `energy_contracts` manifest field (capabilities/energy-contracts.md,
// section 1): contract templates and tariff calendars declared by an integration.
// Same accumulate-errors style as validateManifest, which calls it.
const {
  MAX_ENERGY_TEMPLATES,
  MAX_ENERGY_CALENDARS,
  MAX_ENERGY_TEMPLATE_INPUTS,
  ENERGY_TEMPLATE_KEY_REGEX,
  ENERGY_INPUT_KEY_REGEX,
  ENERGY_INPUT_TYPES,
  ENERGY_PRICING_MODES,
} = require('./constants');
const { validateTariff } = require('../energy-contract/tariff.validate');
const { substituteInputs } = require('../energy-contract/tariff.compile');
const { validateCalendarDefinition } = require('../energy-contract/calendar.declare');
const { isValidTimezone } = require('../energy-contract/contract.validate');
const { TARIFF_COMPONENT_KINDS } = require('../energy-contract/tariff.constants');

const ENERGY_CONTRACTS_FIELDS = ['templates', 'calendars'];
const TEMPLATE_FIELDS = [
  'key',
  'name',
  'description',
  'country',
  'currency',
  'timezone',
  'pricing_mode',
  'version',
  'calendars',
  'inputs',
  'tariff',
];
const INPUT_FIELDS = ['key', 'type', 'label', 'description', 'unit', 'options', 'default', 'required'];
const MAX_INPUT_OPTIONS = 64;
const MAX_VERSION_LENGTH = 32;
const COUNTRY_REGEX = /^[A-Z]{2}$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;
// the value substituted for an input without a default when the tariff is checked
const SAMPLE_INPUT_VALUES = {
  number: 1,
  string: 'sample',
  select: 'sample',
  time_intervals: [['22:00', '06:00']],
};

/**
 * @description Validate one template input (a restricted config field: number, select,
 * string, or the off-peak slots grid `time_intervals`).
 * @param {object} input - The input.
 * @param {string} path - Path for the error messages.
 * @param {Set} seenKeys - Keys already declared in the template.
 * @param {Array} errors - Error accumulator.
 * @param {Function} validateMultiLanguageText - The manifest helper.
 * @example
 * validateInput({ key: 'power', type: 'number' }, 'energy_contracts.templates[0].inputs[0]', new Set(), []);
 */
function validateInput(input, path, seenKeys, errors, validateMultiLanguageText) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(input).forEach((key) => {
    if (!INPUT_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (typeof input.key !== 'string' || !ENERGY_INPUT_KEY_REGEX.test(input.key)) {
    errors.push(`${path}.key: must be a string matching [a-z0-9_]{1,64}`);
  } else if (seenKeys.has(input.key)) {
    errors.push(`${path}.key: duplicate key "${input.key}"`);
  } else {
    seenKeys.add(input.key);
  }
  if (!ENERGY_INPUT_TYPES.includes(input.type)) {
    errors.push(`${path}.type: must be one of ${ENERGY_INPUT_TYPES.join(', ')}`);
  }
  if (input.label !== undefined) {
    validateMultiLanguageText(input.label, `${path}.label`, errors, 1, 64);
  }
  if (input.description !== undefined) {
    validateMultiLanguageText(input.description, `${path}.description`, errors, 1, 256);
  }
  if (
    input.unit !== undefined &&
    (typeof input.unit !== 'string' || input.unit.length === 0 || input.unit.length > 16)
  ) {
    errors.push(`${path}.unit: must be a string of 1-16 characters`);
  }
  if (input.required !== undefined && typeof input.required !== 'boolean') {
    errors.push(`${path}.required: must be a boolean`);
  }
  if (input.type === 'select') {
    if (
      !Array.isArray(input.options) ||
      input.options.length === 0 ||
      input.options.length > MAX_INPUT_OPTIONS ||
      input.options.some((option) => typeof option !== 'string' && typeof option !== 'number')
    ) {
      errors.push(`${path}.options: a select input needs 1-${MAX_INPUT_OPTIONS} string or number options`);
    } else if (input.default !== undefined && !input.options.includes(input.default)) {
      errors.push(`${path}.default: must be one of the options`);
    }
  } else if (input.options !== undefined) {
    errors.push(`${path}.options: only a select input has options`);
  }
  if (input.default !== undefined) {
    if (input.type === 'number' && (typeof input.default !== 'number' || !Number.isFinite(input.default))) {
      errors.push(`${path}.default: must be a finite number`);
    }
    if (input.type === 'string' && typeof input.default !== 'string') {
      errors.push(`${path}.default: must be a string`);
    }
    if (
      input.type === 'time_intervals' &&
      (!Array.isArray(input.default) ||
        input.default.some((interval) => !Array.isArray(interval) || interval.length !== 2))
    ) {
      errors.push(`${path}.default: must be a list of [start, end] time intervals`);
    }
  }
}

/**
 * @description The input values used to check a template tariff: the declared defaults,
 * a sample of the right type otherwise.
 * @param {Array<object>} inputs - The template inputs.
 * @returns {object} Values by key.
 * @example
 * sampleInputValues([{ key: 'power', type: 'number' }]); // { power: 1 }
 */
function sampleInputValues(inputs) {
  const values = {};
  (Array.isArray(inputs) ? inputs : []).forEach((input) => {
    if (input && typeof input === 'object' && typeof input.key === 'string') {
      values[input.key] = input.default !== undefined ? input.default : SAMPLE_INPUT_VALUES[input.type];
    }
  });
  return values;
}

/**
 * @description Validate one contract template.
 * @param {object} template - The template.
 * @param {number} index - Index in the list.
 * @param {Set} seenKeys - Template keys already declared.
 * @param {Array} errors - Error accumulator.
 * @param {Function} validateMultiLanguageText - The manifest helper.
 * @example
 * validateTemplate(template, 0, new Set(), [], validateMultiLanguageText);
 */
function validateTemplate(template, index, seenKeys, errors, validateMultiLanguageText) {
  const path = `energy_contracts.templates[${index}]`;
  if (template === null || typeof template !== 'object' || Array.isArray(template)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  Object.keys(template).forEach((key) => {
    if (!TEMPLATE_FIELDS.includes(key)) {
      errors.push(`${path}.${key}: unknown field`);
    }
  });
  if (typeof template.key !== 'string' || !ENERGY_TEMPLATE_KEY_REGEX.test(template.key)) {
    errors.push(`${path}.key: must be a string matching [a-z0-9][a-z0-9-]{0,63}`);
  } else if (seenKeys.has(template.key)) {
    errors.push(`${path}.key: duplicate key "${template.key}"`);
  } else {
    seenKeys.add(template.key);
  }
  validateMultiLanguageText(template.name, `${path}.name`, errors, 1, 64);
  if (template.description !== undefined) {
    validateMultiLanguageText(template.description, `${path}.description`, errors, 1, 512);
  }
  if (typeof template.country !== 'string' || !COUNTRY_REGEX.test(template.country)) {
    errors.push(`${path}.country: must be an ISO 3166-1 alpha-2 code`);
  }
  if (typeof template.currency !== 'string' || !CURRENCY_REGEX.test(template.currency)) {
    errors.push(`${path}.currency: must be an ISO 4217 code`);
  }
  if (
    template.timezone !== undefined &&
    (typeof template.timezone !== 'string' || !isValidTimezone(template.timezone))
  ) {
    errors.push(`${path}.timezone: must be a known IANA timezone`);
  }
  if (!ENERGY_PRICING_MODES.includes(template.pricing_mode)) {
    errors.push(`${path}.pricing_mode: must be one of ${ENERGY_PRICING_MODES.join(', ')}`);
  }
  if (
    typeof template.version !== 'string' ||
    template.version.length === 0 ||
    template.version.length > MAX_VERSION_LENGTH
  ) {
    errors.push(`${path}.version: must be a string of 1-${MAX_VERSION_LENGTH} characters`);
  }
  if (template.calendars !== undefined) {
    if (
      !Array.isArray(template.calendars) ||
      template.calendars.length > 8 ||
      template.calendars.some((key) => typeof key !== 'string' || !ENERGY_TEMPLATE_KEY_REGEX.test(key))
    ) {
      errors.push(`${path}.calendars: must be a list of at most 8 calendar keys`);
    }
  }
  if (template.inputs !== undefined) {
    if (!Array.isArray(template.inputs) || template.inputs.length > MAX_ENERGY_TEMPLATE_INPUTS) {
      errors.push(`${path}.inputs: must be a list of at most ${MAX_ENERGY_TEMPLATE_INPUTS} inputs`);
    } else {
      const seenInputKeys = new Set();
      template.inputs.forEach((input, inputIndex) =>
        validateInput(input, `${path}.inputs[${inputIndex}]`, seenInputKeys, errors, validateMultiLanguageText),
      );
    }
  }
  const isDelegated = template.pricing_mode === 'delegated';
  if (template.tariff === undefined) {
    if (!isDelegated) {
      errors.push(`${path}.tariff: is required in rules mode`);
    }
    return;
  }
  if (template.tariff === null || typeof template.tariff !== 'object' || Array.isArray(template.tariff)) {
    errors.push(`${path}.tariff: must be an object`);
    return;
  }
  let substituted;
  try {
    substituted = substituteInputs(template.tariff, sampleInputValues(template.inputs));
    validateTariff(substituted);
  } catch (e) {
    errors.push(`${path}.${e.message}`);
    return;
  }
  if (isDelegated) {
    const other = substituted.components.find((component) => component.kind !== TARIFF_COMPONENT_KINDS.FIXED);
    if (other) {
      errors.push(
        `${path}.tariff.components: a delegated template only carries fixed components (found "${other.kind}")`,
      );
    }
  }
  const declared = new Set(Array.isArray(template.calendars) ? template.calendars : []);
  (Array.isArray(substituted.calendars) ? substituted.calendars : []).forEach((key) => {
    if (!declared.has(key)) {
      errors.push(`${path}.calendars: the tariff references calendar "${key}", list it in the template calendars`);
    }
  });
}

/**
 * @description Validate the `energy_contracts` field of a manifest.
 * @param {object} value - The field value.
 * @param {Array} errors - Error accumulator.
 * @param {Function} validateMultiLanguageText - The manifest helper.
 * @example
 * validateEnergyContractsField(manifest.energy_contracts, errors, validateMultiLanguageText);
 */
function validateEnergyContractsField(value, errors, validateMultiLanguageText) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    errors.push('energy_contracts: must be an object');
    return;
  }
  Object.keys(value).forEach((key) => {
    if (!ENERGY_CONTRACTS_FIELDS.includes(key)) {
      errors.push(`energy_contracts.${key}: unknown field`);
    }
  });
  if (value.templates === undefined && value.calendars === undefined) {
    errors.push('energy_contracts: must declare templates or calendars');
  }
  if (value.templates !== undefined) {
    if (
      !Array.isArray(value.templates) ||
      value.templates.length === 0 ||
      value.templates.length > MAX_ENERGY_TEMPLATES
    ) {
      errors.push(`energy_contracts.templates: must be a list of 1-${MAX_ENERGY_TEMPLATES} templates`);
    } else {
      const seenKeys = new Set();
      value.templates.forEach((template, index) =>
        validateTemplate(template, index, seenKeys, errors, validateMultiLanguageText),
      );
    }
  }
  if (value.calendars !== undefined) {
    if (
      !Array.isArray(value.calendars) ||
      value.calendars.length === 0 ||
      value.calendars.length > MAX_ENERGY_CALENDARS
    ) {
      errors.push(`energy_contracts.calendars: must be a list of 1-${MAX_ENERGY_CALENDARS} calendars`);
    } else {
      const seenKeys = new Set();
      value.calendars.forEach((calendar, index) => {
        const path = `energy_contracts.calendars[${index}]`;
        try {
          const normalized = validateCalendarDefinition(calendar, 'UTC');
          if (seenKeys.has(normalized.key)) {
            errors.push(`${path}.key: duplicate key "${normalized.key}"`);
          }
          seenKeys.add(normalized.key);
        } catch (e) {
          errors.push(`${path}: ${e.message}`);
        }
      });
    }
  }
}

module.exports = {
  validateEnergyContractsField,
  validateTemplate,
  validateInput,
  sampleInputValues,
};
