// `visible_if` on a form field of the manifest grammar (config_schema, action
// and scene fields, widget settings, contact_schema, account_schema): the
// field is shown — and only then required, validated and relayed — when an
// EARLIER field of the same list holds one of the listed values. Pure
// functions, shared by the server (required checks, scene trigger matching)
// and the frontend form engine, so both sides always agree on which fields
// are visible.

/**
 * @description Whether a value counts as "not set": undefined, null or an
 * empty string, like a wildcard scene filter or an empty scene action field.
 * @param {*} value - The value.
 * @returns {boolean} True when the value is not set.
 * @example
 * isUnsetValue(''); // true
 */
function isUnsetValue(value) {
  return value === undefined || value === null || value === '';
}

/**
 * @description Whether a visible_if condition is well-formed: `{ field, in }`
 * with a string field and a list of values. The manifest validation refuses
 * anything else; this guards the content an integration pushes at runtime
 * (widget content) and hand-edited data, which never went through it.
 * @param {*} condition - The visible_if value.
 * @returns {boolean} True when the condition can be evaluated.
 * @example
 * isWellFormedCondition({ field: 'mode', in: ['local'] }); // true
 */
function isWellFormedCondition(condition) {
  return (
    condition !== null &&
    typeof condition === 'object' &&
    !Array.isArray(condition) &&
    typeof condition.field === 'string' &&
    Array.isArray(condition.in)
  );
}

/**
 * @description Whether the current value of the referenced field satisfies a
 * visible_if condition. A value that is not set (undefined, null, '') falls
 * back to the declared default of the referenced field; a multi_select
 * matches as soon as one of its values is listed. A malformed condition
 * never matches.
 * @param {object} condition - The visible_if object `{ field, in }`.
 * @param {object} referencedField - The field the condition points to.
 * @param {object} values - The current values, keyed by field key.
 * @returns {boolean} True when the condition holds.
 * @example
 * matchesVisibleIf({ field: 'mode', in: ['local'] }, { key: 'mode', default: 'local' }, {});
 */
function matchesVisibleIf(condition, referencedField, values) {
  if (!isWellFormedCondition(condition)) {
    return false;
  }
  const current = (values || {})[condition.field];
  const value = isUnsetValue(current) ? referencedField.default : current;
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
 * an unknown or later field, or a malformed one, hides the field: the
 * manifest validation refuses such a declaration, this is only the safe
 * answer to content that skipped it.
 * @param {Array} fields - The declared fields, in declaration order.
 * @param {object} [values] - The current values, keyed by field key.
 * @returns {Array} The visible fields, in declaration order.
 * @example
 * getVisibleFields(manifest.config_schema, configValues);
 */
function getVisibleFields(fields, values) {
  const visibleByKey = new Map();
  return (Array.isArray(fields) ? fields : []).filter((field) => {
    if (field === null || typeof field !== 'object') {
      return false;
    }
    const condition = field.visible_if;
    const visible =
      condition === undefined ||
      (isWellFormedCondition(condition) &&
        visibleByKey.has(condition.field) &&
        matchesVisibleIf(condition, visibleByKey.get(condition.field), values));
    if (visible) {
      visibleByKey.set(field.key, field);
    }
    return visible;
  });
}

/**
 * @description Resolve the values of a form the way every server entry point
 * does: a value that is not set takes the declared default, then only the
 * visible fields are kept — a hidden field is neither validated, nor
 * required, nor relayed to the integration (a stale value left by an earlier
 * choice must not block the form). The caller validates `values` and throws
 * on `missingRequired`.
 * @param {Array} fields - The declared fields, in declaration order (no section).
 * @param {object} [rawValues] - The values received, keyed by field key.
 * @param {object} [options] - Options.
 * @param {Function} [options.isUnset] - Whether a received value is not set
 * (default: undefined only; a scene also treats null and '' as not set).
 * @returns {object} `{ values, missingRequired }`: the visible values set,
 * and the visible required fields left without a value.
 * @example
 * const { values, missingRequired } = resolveVisibleValues(action.fields, body.fields);
 */
function resolveVisibleValues(fields, rawValues, { isUnset = (value) => value === undefined } = {}) {
  const received = rawValues || {};
  const resolved = {};
  fields.forEach((field) => {
    if (!isUnset(received[field.key])) {
      resolved[field.key] = received[field.key];
    } else if (field.default !== undefined) {
      resolved[field.key] = field.default;
    }
  });
  const values = {};
  const missingRequired = [];
  getVisibleFields(fields, resolved).forEach((field) => {
    if (resolved[field.key] !== undefined) {
      values[field.key] = resolved[field.key];
    } else if (field.required) {
      missingRequired.push(field);
    }
  });
  return { values, missingRequired };
}

module.exports = {
  getVisibleFields,
  isUnsetValue,
  matchesVisibleIf,
  resolveVisibleValues,
};
