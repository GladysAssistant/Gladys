// A HomeKit accessory can carry several services of the same type — one per button on a remote,
// one per shutter, a Thermostat next to a standalone TemperatureSensor — and
// `Accessory.getService(type)` returns the first of them. An update therefore needs a way back from
// the Gladys feature that changed to the service that was actually built from it, which the
// positional `${category} ${index}` subtype cannot give: it is only meaningful inside the loop that
// produced it.
//
// The link is kept in memory on the accessory rather than encoded in the HomeKit subtype, because
// subtypes take part in the service identifiers HAP-NodeJS persists for a paired bridge: deriving
// them from feature selectors would renumber the services of every already-paired home.
const FEATURE_SERVICES = Symbol('gladysFeatureServices');

/**
 * @description Record which HomeKit service a set of Gladys features was built into.
 * @param {object} accessory - HomeKit accessory holding the service.
 * @param {object} service - HomeKit service built from those features.
 * @param {Array} features - Gladys features the service was built from.
 * @returns {undefined}
 * @example
 * indexFeatureService(accessory, service, [feature]);
 */
function indexFeatureService(accessory, service, features) {
  const index = accessory[FEATURE_SERVICES] || new Map();

  features
    .filter((feature) => feature.selector)
    .forEach((feature) => {
      index.set(feature.selector, service);
    });

  accessory[FEATURE_SERVICES] = index;
}

/**
 * @description Find the HomeKit service a Gladys feature was built into.
 * @param {object} accessory - HomeKit accessory to look into.
 * @param {object} feature - Gladys feature that changed.
 * @returns {object} Service built from that feature, or undefined when the accessory has no index.
 * @example
 * findFeatureService(accessory, feature);
 */
function findFeatureService(accessory, feature) {
  const index = accessory[FEATURE_SERVICES];

  return index ? index.get(feature.selector) : undefined;
}

module.exports = {
  indexFeatureService,
  findFeatureService,
};
