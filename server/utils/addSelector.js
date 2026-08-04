const { slugify } = require('./slugify');
const { ConflictError } = require('./coreErrors');

// A selector derived from a name is not unique by construction: two objects
// can legitimately carry the same name (an integration publishing two
// "MacBook Pro de Pierre", two "Prise" in Zigbee2mqtt), while the selector
// column is unique in DB. Readable suffixes are tried first ("-2", "-3"…),
// then random characters: past a handful of homonyms, scanning numbers costs
// one query per taken slot for no readability gain.
const MAX_NUMERIC_SUFFIX = 20;
const MAX_RANDOM_ATTEMPTS = 5;

/**
 * @description Add a selector to a given object.
 * @param {object} item - Any object to add a selector to.
 * @example
 * addSelector({
 *  name: 'my object'
 * });
 */
function addSelector(item) {
  if (item.selector) {
    item.selector = slugify(item.selector);
  } else if (item.name) {
    item.selector = slugify(item.name);
  }
}

/**
 * @description Add a selector in the context of a beforeValidate sequelize hook.
 * @param {object} item - Any object to add a selector to.
 * @example
 * addSelectorBeforeValidateHook({
 *  name: 'my object'
 * });
 */
function addSelectorBeforeValidateHook(item) {
  // We only slugify the selector for creation, not update
  if (item.isNewRecord) {
    addSelector(item);
  }
}

/**
 * @description Build a selector derived from `base` and free in the given model.
 * @param {object} model - The sequelize model owning the unique selector column.
 * @param {string} base - The wished selector, slugified if needed.
 * @param {object} [options] - Options.
 * @param {object} [options.transaction] - The transaction the lookups must run in.
 * @param {Set} [options.taken] - Selectors already handed out in the current batch,
 * not yet inserted in DB (the features of a device are saved in one pass).
 * @returns {Promise<string>} Resolve with a free selector.
 * @example
 * const selector = await buildUniqueSelector(db.Device, 'macbook-pro-de-pierre');
 */
async function buildUniqueSelector(model, base, { transaction, taken } = {}) {
  const slugifiedBase = slugify(base || '');
  // An empty base is not our business: the row has neither name nor selector
  // and the model validation rejects it with its own message.
  if (slugifiedBase.length === 0) {
    return slugifiedBase;
  }
  const isFree = async (candidate) => {
    if (taken && taken.has(candidate)) {
      return false;
    }
    const existing = await model.findOne({ where: { selector: candidate }, attributes: ['id'], transaction });
    return existing === null;
  };
  let candidate = slugifiedBase;
  let attempt = 0;
  // eslint-disable-next-line no-await-in-loop
  while (!(await isFree(candidate))) {
    attempt += 1;
    if (attempt > MAX_NUMERIC_SUFFIX + MAX_RANDOM_ATTEMPTS) {
      // A ConflictError, like the 409 a DB unique-constraint collision on the
      // selector produces: exhausting the candidates is the same conflict,
      // seen before the insert instead of by the constraint.
      throw new ConflictError(`Unable to find a free selector based on "${slugifiedBase}"`);
    }
    candidate = attempt <= MAX_NUMERIC_SUFFIX ? `${slugifiedBase}-${attempt + 1}` : slugify(slugifiedBase, true);
  }
  if (taken) {
    taken.add(candidate);
  }
  return candidate;
}

module.exports = {
  addSelector,
  addSelectorBeforeValidateHook,
  buildUniqueSelector,
};
