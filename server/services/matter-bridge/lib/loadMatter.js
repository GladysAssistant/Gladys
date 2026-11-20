/**
 * @description Load the matter.js modules. Gladys builds every service at start-up, so they are
 * not required when the service is built but when the bridge starts: matter.js sets up its Node.js
 * platform when it is loaded, which only an enabled bridge needs.
 * @returns {object} The matter.js modules: { main, devices, endpoints, behaviors }.
 * @example
 * const matter = loadMatter();
 */
function loadMatter() {
  return {
    main: require('@matter/main'),
    // eslint-plugin-import does not read the "exports" map these sub-paths are declared in.
    // eslint-disable-next-line import/no-unresolved
    devices: require('@matter/main/devices'),
    // eslint-disable-next-line import/no-unresolved
    endpoints: require('@matter/main/endpoints'),
    // eslint-disable-next-line import/no-unresolved
    behaviors: require('@matter/main/behaviors'),
  };
}

module.exports = {
  loadMatter,
};
