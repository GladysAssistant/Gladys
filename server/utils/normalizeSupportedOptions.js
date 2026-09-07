const Joi = require('joi');
const { BadParameters } = require('./coreErrors');

const integerValueSchema = Joi.number().integer();

// `value` is polymorphic: an integer for enum-like options (modes, fan speeds...), a
// free string for dynamic selects (installed TV apps, HDMI sources...). String values
// are reserved for `text`/`select` features — on any other feature a string option
// would produce a state `device.setValue` refuses to persist, so they are rejected at
// validation time. The storage split between the `value` and `value_string` columns is
// internal to the sync layer, so the `value_string` a round-tripped device carries is
// stripped like the DB metadata below.
const stringOrIntegerValueSchema = Joi.alternatives().try(
  integerValueSchema,
  Joi.string()
    .trim()
    .min(1),
);

const buildSupportedOptionsSchema = (valueSchema) =>
  Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .uuid()
          .optional(),
        value: valueSchema.required(),
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
      }),
    )
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

const integerOptionsSchema = buildSupportedOptionsSchema(integerValueSchema);
const stringOrIntegerOptionsSchema = buildSupportedOptionsSchema(stringOrIntegerValueSchema);

/**
 * @description Validate and normalize supported_options for a device feature.
 * @param {Array} options - The supported options to normalize.
 * @param {object} [validationOptions] - Validation options.
 * @param {boolean} [validationOptions.allowStringValues] - Allow string option values (text/select features only).
 * @returns {Array} Normalized supported options.
 * @example
 * normalizeSupportedOptions([{ value: 1, label: 'On' }]);
 */
function normalizeSupportedOptions(options, { allowStringValues = false } = {}) {
  const schema = allowStringValues ? stringOrIntegerOptionsSchema : integerOptionsSchema;
  const { error, value } = schema.validate(options, {
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
