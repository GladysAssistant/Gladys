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

// The `label` column is a STRING: one translation must fit in it, since the
// English text becomes the label every consumer reads.
const LABEL_MAX_LENGTH = 255;
// Same language codes as the multi-language texts of the external integration
// manifest (`en`, `fr`, `pt-BR`...). A language Gladys does not display yet is
// kept, not refused: it costs one key, and a discovery is never rejected for it.
const LANGUAGE_KEY_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

const translationTextSchema = Joi.string()
  .trim()
  .min(1)
  .max(LABEL_MAX_LENGTH);

// A multi-language label ({ en, fr?, de?, es?... }), `en` required like every
// multi-language text of the external integration contract.
const labelTranslationsSchema = Joi.object()
  .keys({ en: translationTextSchema.required() })
  .pattern(LANGUAGE_KEY_REGEX, translationTextSchema);

const buildSupportedOptionsSchema = (valueSchema) =>
  Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .uuid()
          .optional(),
        value: valueSchema.required(),
        // a plain string, or a multi-language object an integration publishes
        // so the option shows in the user's language
        label: Joi.alternatives()
          .conditional(Joi.object(), {
            then: labelTranslationsSchema,
            otherwise: Joi.string()
              .trim()
              .min(1),
          })
          .required(),
        // the stored form, sent back as is by a device round-tripped through
        // the frontend (POST /api/v1/device)
        label_translations: labelTranslationsSchema.allow(null).optional(),
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
 * @description Validate and normalize supported_options for a device feature. An
 * option label is a string or a multi-language object ({ en, fr?, ... }): the
 * object is kept in `label_translations` and `label` becomes its English text.
 * @param {Array} options - The supported options to normalize.
 * @param {object} [validationOptions] - Validation options.
 * @param {boolean} [validationOptions.allowStringValues] - Allow string option values (text/select features only).
 * @returns {Array} Normalized supported options.
 * @example
 * normalizeSupportedOptions([{ value: 1, label: { en: 'Healthy', fr: 'Sain' } }]);
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

  return value.map((option, index) => {
    // label_translations is the source of truth when there is one: `label`
    // then holds its English text, the fallback every consumer that knows
    // nothing of translations (HomeKit, Matter, scenes, history...) reads
    let labelTranslations = null;
    if (typeof option.label === 'object') {
      labelTranslations = option.label;
    } else if (option.label_translations) {
      labelTranslations = option.label_translations;
    }
    return {
      ...option,
      label: labelTranslations ? labelTranslations.en : option.label,
      label_translations: labelTranslations,
      sort_order: option.sort_order !== undefined ? option.sort_order : index,
    };
  });
}

module.exports = {
  normalizeSupportedOptions,
};
