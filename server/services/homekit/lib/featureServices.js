// Service subtypes identify already-paired HomeKit cards. Keep the feature-to-service links in
// memory instead of changing those identities when several cards share the same physical sensor.
const FEATURE_SERVICES = Symbol('gladysFeatureServices');

/**
 * @description Record all HomeKit services built from a Gladys feature.
 * @param {object} accessory - Accessory holding the services.
 * @param {object} service - Service built from these features.
 * @param {Array} features - Features bound to this service.
 * @returns {undefined}
 * @example
 * indexFeatureService(accessory, service, [setpoint, temperature]);
 */
function indexFeatureService(accessory, service, features) {
  const index = accessory[FEATURE_SERVICES] || new Map();
  features
    .filter((feature) => feature.selector)
    .forEach((feature) => {
      const services = index.get(feature.selector) || new Set();
      services.add(service);
      index.set(feature.selector, services);
    });
  accessory[FEATURE_SERVICES] = index;
}

/**
 * @description Find every service that depends on a feature, including shared temperature sensors.
 * @param {object} accessory - Accessory to search.
 * @param {object} feature - Feature whose state changed.
 * @returns {Array} Services bound to the feature, or an empty array.
 * @example
 * findFeatureServices(accessory, temperature).forEach(updateTemperature);
 */
function findFeatureServices(accessory, feature) {
  const index = accessory[FEATURE_SERVICES];
  return index ? Array.from(index.get(feature.selector) || []) : [];
}

/**
 * @description Find the primary service built from a feature.
 * @param {object} accessory - Accessory to search.
 * @param {object} feature - Feature whose state changed.
 * @returns {object|undefined} The first service bound to this feature.
 * @example
 * const service = findFeatureService(accessory, setpoint);
 */
function findFeatureService(accessory, feature) {
  return findFeatureServices(accessory, feature)[0];
}

module.exports = { indexFeatureService, findFeatureService, findFeatureServices };
