// Removal of the dated parts of a tariff that can never price an interval of the contract
// (docs/specs/energy-contracts.md, section 3): a template carrying years of price history
// (the v1 catalogue conversion, one dated block per price change) stays within the limits
// once only the history overlapping the contract's validity is kept.
const { TARIFF_COMPONENT_KINDS, DATE_REGEX } = require('./tariff.constants');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDate = (value) => typeof value === 'string' && DATE_REGEX.test(value);

/**
 * @description Tell whether a `when` carries a well-formed `dates` condition entirely outside
 * a validity window (a malformed one is kept, the validation reports it).
 * @param {object} when - Conditions of a rule or a component.
 * @param {string} [validFrom] - First local date of the window (`YYYY-MM-DD`), open when absent.
 * @param {string} [validTo] - Last local date of the window, open when absent.
 * @returns {boolean} True when the condition never matches a date of the window.
 * @example
 * isOutsideValidity({ dates: { from: '2020-01-01', to: '2020-12-31' } }, '2026-01-01'); // true
 */
function isOutsideValidity(when, validFrom, validTo) {
  if (!isObject(when) || !isObject(when.dates) || !isDate(when.dates.from)) {
    return false;
  }
  const { from, to } = when.dates;
  if (to !== undefined && !isDate(to)) {
    return false;
  }
  return (isDate(validFrom) && to !== undefined && to < validFrom) || (isDate(validTo) && from > validTo);
}

/**
 * @description Drop the consumption rules and the components whose `dates` condition overlaps
 * none of the validity windows: they can never match an interval the contract prices, so the
 * prices are unchanged. A tax loses the components removed from its `applies_to`, and is
 * removed with them when none is left. The tariff is returned unchanged when nothing is dated
 * outside the windows or when it is malformed (the validation reports it).
 * @param {object} tariff - Tariff definition, inputs substituted.
 * @param {object|Array<object>} [validity] - `{ valid_from, valid_to }` local dates, each one open
 * when absent, or several such windows (a part is kept when it overlaps one of them).
 * @returns {object} The tariff without the dated parts outside the windows.
 * @example
 * pruneTariffToValidity(tariff, { valid_from: '2026-10-01' });
 */
function pruneTariffToValidity(tariff, validity = {}) {
  if (!isObject(tariff) || !Array.isArray(tariff.components)) {
    return tariff;
  }
  const windows = Array.isArray(validity) ? validity : [validity];
  const outside = (when) => windows.every((window) => isOutsideValidity(when, window.valid_from, window.valid_to));
  const removed = new Set();
  let changed = false;
  const components = tariff.components.reduce((kept, component) => {
    if (!isObject(component)) {
      kept.push(component);
      return kept;
    }
    // a consumption component is never dated itself, its rules are
    if (component.kind === TARIFF_COMPONENT_KINDS.CONSUMPTION && Array.isArray(component.rules)) {
      const rules = component.rules.filter((rule) => !isObject(rule) || !outside(rule.when));
      if (rules.length < component.rules.length) {
        changed = true;
        kept.push({ ...component, rules });
        return kept;
      }
    } else if (component.kind !== TARIFF_COMPONENT_KINDS.CONSUMPTION && outside(component.when)) {
      removed.add(component.key);
      changed = true;
      return kept;
    }
    // a tax applies to components declared before it: it loses the removed ones, and goes
    // with them when none is left
    if (component.kind === TARIFF_COMPONENT_KINDS.TAX && Array.isArray(component.applies_to)) {
      const appliesTo = component.applies_to.filter((key) => !removed.has(key));
      if (appliesTo.length < component.applies_to.length) {
        changed = true;
        if (appliesTo.length === 0) {
          removed.add(component.key);
          return kept;
        }
        kept.push({ ...component, applies_to: appliesTo });
        return kept;
      }
    }
    kept.push(component);
    return kept;
  }, []);
  return changed ? { ...tariff, components } : tariff;
}

module.exports = { pruneTariffToValidity, isOutsideValidity };
