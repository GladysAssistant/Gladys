const Joi = require('joi');
const { BadParameters } = require('./coreErrors');

const supportedOptionSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .optional(),
  value: Joi.number()
    .integer()
    .required(),
  label: Joi.string()
    .trim()
    .min(1)
    .required(),
  sort_order: Joi.number()
    .integer()
    .optional(),
});

const supportedOptionsSchema = Joi.array()
  .items(supportedOptionSchema)
  .required()
  .custom((options, helpers) => {
    const values = options.map((option) => option.value);
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
