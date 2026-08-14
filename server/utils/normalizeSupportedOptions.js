const Joi = require('joi');
const { BadParameters } = require('./coreErrors');

// Option values are either integers (enum-like features: modes, fan speeds...) or free
// strings (dynamic selects: installed TV apps, HDMI sources...). A string holding a
// round-trippable safe integer is canonicalized to a number so every value has exactly
// one stored form and integer options declared as '5' or 5 cannot coexist.
const canonicalizeOptionValue = (value) => {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const parsedValue = parseInt(value, 10);
    if (Number.isSafeInteger(parsedValue) && `${parsedValue}` === value) {
      return parsedValue;
    }
  }
  return value;
};

// Devices loaded from the API carry the full DeviceFeatureSupportedOption rows,
// so DB metadata fields must be stripped when the device is saved again
const supportedOptionSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .optional(),
  value: Joi.alternatives()
    .try(
      Joi.number().integer(),
      Joi.string()
        .trim()
        .min(1),
    )
    .required(),
  label: Joi.string()
    .trim()
    .min(1)
    .required(),
  sort_order: Joi.number()
    .integer()
    .optional(),
  device_feature_id: Joi.any().strip(),
  created_at: Joi.any().strip(),
  updated_at: Joi.any().strip(),
});

const supportedOptionsSchema = Joi.array()
  .items(supportedOptionSchema)
  .required()
  .custom((options, helpers) => {
    const values = options.map((option) => `${canonicalizeOptionValue(option.value)}`);
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      return helpers.error('any.custom', { message: 'supported_options must not contain duplicate values' });
    }
    return options;
  })
  .messages({
    'any.custom': '{{#message}}',
  });

/**
 * @description Validate and normalize supported_options for a device feature.
 * @param {Array} options - The supported options to normalize.
 * @returns {Array} Normalized supported options.
 * @example
 * normalizeSupportedOptions([{ value: 1, label: 'On' }]);
 */
function normalizeSupportedOptions(options) {
  const { error, value } = supportedOptionsSchema.validate(options, {
    abortEarly: false,
    convert: false,
  });

  if (error) {
    throw new BadParameters(error.details.map((detail) => detail.message).join(', '));
  }

  return value.map((option, index) => ({
    ...option,
    value: canonicalizeOptionValue(option.value),
    sort_order: option.sort_order !== undefined ? option.sort_order : index,
  }));
}

module.exports = {
  normalizeSupportedOptions,
};
