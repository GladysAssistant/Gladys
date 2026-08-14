const Joi = require('joi');
const { BadParameters } = require('./coreErrors');

// Devices loaded from the API carry the full DeviceFeatureSupportedOption rows,
// so DB metadata fields must be stripped when the device is saved again.
// `value` is polymorphic: an integer for enum-like options (modes, fan speeds...), a
// free string for dynamic selects (installed TV apps, HDMI sources...). The storage
// split between the `value` and `value_string` columns is internal to the sync layer,
// so the `value_string` a round-tripped device carries is stripped like the metadata.
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
  value_string: Joi.any().strip(),
  device_feature_id: Joi.any().strip(),
  created_at: Joi.any().strip(),
  updated_at: Joi.any().strip(),
});

const supportedOptionsSchema = Joi.array()
  .items(supportedOptionSchema)
  .required()
  .custom((options, helpers) => {
    // Compared in string form: an integer and its string twin ('5' and 5) would be
    // indistinguishable in the UI and match the same state, so they count as duplicates
    const values = options.map((option) => `${option.value}`);
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
    sort_order: option.sort_order !== undefined ? option.sort_order : index,
  }));
}

module.exports = {
  normalizeSupportedOptions,
};
