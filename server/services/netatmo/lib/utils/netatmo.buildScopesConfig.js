/**
 * @description Poll refreshing Token values of an Netatmo device.
 * @param {object} scopes - Scopes format.
 * @returns {object} Object scopes string  - Returns all scopes as a string object separating scopes by API.
 * @example
 * buildScopesConfig({
 * ENERGY: {
 *   read: 'read_thermostat',
 *   write: 'write_thermostat',
 * }});
 */
function buildScopesConfig(scopes) {
  const scopesConfig = {};
  Object.keys(scopes).forEach((key) => {
    const words = key.toLowerCase().split('_');
    const camelCaseKey = words
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');
    const scopeKey = `scope${camelCaseKey.charAt(0).toUpperCase() + camelCaseKey.slice(1)}`;
    scopesConfig[scopeKey] = Object.values(scopes[key]).join(' ');
  });

  return scopesConfig;
}

module.exports = buildScopesConfig;
