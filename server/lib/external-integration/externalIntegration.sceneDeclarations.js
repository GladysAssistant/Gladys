// Helpers shared by the scene-trigger and scene-action paths of the
// supervisor: the declarations of a manifest and the coercion of the values
// exchanged with a scene (the payloads come from unaudited code, everything
// is whitelisted and coerced by the declared type — the normalizeWeather
// doctrine).

/**
 * @description The scene triggers declared by a manifest.
 * @param {object} manifest - The integration manifest.
 * @returns {Array} The declared triggers (empty when none).
 * @example
 * const triggers = getDeclaredSceneTriggers(service.manifest);
 */
function getDeclaredSceneTriggers(manifest) {
  return (manifest && Array.isArray(manifest.scene_triggers) && manifest.scene_triggers) || [];
}

/**
 * @description The scene actions declared by a manifest.
 * @param {object} manifest - The integration manifest.
 * @returns {Array} The declared actions (empty when none).
 * @example
 * const actions = getDeclaredSceneActions(service.manifest);
 */
function getDeclaredSceneActions(manifest) {
  return (manifest && Array.isArray(manifest.scene_actions) && manifest.scene_actions) || [];
}

/**
 * @description The scalar type a trigger filter compares against: a select
 * value is the string it is, a number field is compared as a number
 * (boolean cannot occur in a trigger filter, sections carry no value).
 * @param {object} field - The declared field.
 * @returns {string} 'string' or 'number'.
 * @example
 * getFilterType({ type: 'select' }); // 'string'
 */
function getFilterType(field) {
  return field.type === 'number' ? 'number' : 'string';
}

/**
 * @description Coerce a value published by an integration to the declared
 * scalar type: kept when already of that type, coerced when unambiguous
 * (numeric string -> number, number -> its decimal string, "true"/"false"
 * -> boolean), dropped to null otherwise — a filter set on that key then
 * does not match, which is the safe outcome.
 * @param {any} value - The published value.
 * @param {string} type - The declared type ('string', 'number', 'boolean').
 * @returns {string|number|boolean|null} The coerced value.
 * @example
 * coerceSceneValue('12', 'number'); // 12
 */
function coerceSceneValue(value, type) {
  if (value === null || value === undefined) {
    return null;
  }
  switch (type) {
    case 'string':
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
      return null;
    case 'number': {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
        return Number(value);
      }
      return null;
    }
    case 'boolean':
      if (typeof value === 'boolean') {
        return value;
      }
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
      return null;
    default:
      return null;
  }
}

module.exports = {
  getDeclaredSceneTriggers,
  getDeclaredSceneActions,
  getFilterType,
  coerceSceneValue,
};
