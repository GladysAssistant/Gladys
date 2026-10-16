// `visible_if` on a form field of the manifest grammar (config_schema, action
// and scene fields, widget settings, contact_schema, account_schema): the
// field is shown — and only then required — when an EARLIER field of the same
// list holds one of the listed values. Pure functions, shared by the server
// (required checks, scene trigger matching) and the frontend form engine, so
// both sides always agree on which fields are visible.

/**
 * @description Whether the current value of the referenced field satisfies a
 * visible_if condition. A missing value falls back to the declared default of
 * the referenced field; a multi_select matches as soon as one of its values is
 * listed.
 * @param {object} condition - The visible_if object `{ field, in }`.
 * @param {object} referencedField - The field the condition points to.
 * @param {object} values - The current values, keyed by field key.
 * @returns {boolean} True when the condition holds.
 * @example
 * matchesVisibleIf({ field: 'mode', in: ['local'] }, { key: 'mode', default: 'local' }, {});
 */
function matchesVisibleIf(condition, referencedField, values) {
  const value = values[condition.field] === undefined ? referencedField.default : values[condition.field];
  if (Array.isArray(value)) {
    return value.some((item) => condition.in.includes(item));
  }
  return condition.in.includes(value);
}

/**
 * @description Keep the fields of a form that are visible for the given
 * values. A field is visible when it declares no visible_if, or when the field
 * it references is itself visible and its value matches the condition (so a
 * chain of conditions hides a whole branch at once). A condition pointing to
 * an unknown or later field hides the field: the manifest validation refuses
 * such a declaration, this is only the safe answer to a hand-edited one.
 * @param {Array} fields - The declared fields, in declaration order.
 * @param {object} [values] - The current values, keyed by field key.
 * @returns {Array} The visible fields, in declaration order.
 * @example
 * getVisibleFields(manifest.config_schema, configValues);
 */
function getVisibleFields(fields = [], values = {}) {
  const visibleByKey = new Map();
  return fields.filter((field) => {
    const condition = field.visible_if;
    const visible =
      !condition ||
      (visibleByKey.has(condition.field) &&
        matchesVisibleIf(condition, visibleByKey.get(condition.field), values || {}));
    if (visible) {
      visibleByKey.set(field.key, field);
    }
    return visible;
  });
}

/**
 * @description Whether one field of a form is visible for the given values.
 * @param {Array} fields - The declared fields, in declaration order.
 * @param {string} key - The key of the field.
 * @param {object} [values] - The current values, keyed by field key.
 * @returns {boolean} True when the field is visible.
 * @example
 * isFieldVisible(action.fields, 'host', resolvedFields);
 */
function isFieldVisible(fields, key, values) {
  return getVisibleFields(fields, values).some((field) => field.key === key);
}

module.exports = {
  getVisibleFields,
  isFieldVisible,
  matchesVisibleIf,
};
